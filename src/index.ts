import { compile as mdxCompile, compileSync as mdxCompileSync } from '@mdx-js/mdx';
import generate from '@babel/generator';
import * as t from '@babel/types';
import cloneDeep from 'lodash/cloneDeep';
import toBabel from 'estree-to-babel';
import { toEstree } from 'hast-util-to-estree';

// Keeping as much code as possible from the original compiler to avoid breaking changes
import {
  genCanvasExports,
  genStoryExport,
  genMeta,
  CompilerOptions,
  Context,
  MetaExport,
  wrapperJs,
  stringifyMeta,
} from './sb-mdx-plugin';
import type { CompileOptions, MdxCompileOptions, JSXOptions } from './types';
import { transformJSXAsync, transformJSXSync } from './jsx';

export type { CompileOptions, MdxCompileOptions, JSXOptions };

export const SEPARATOR = '/* ========= */';

export { wrapperJs };

const hasStoryChild = (node: any) => {
  return node.children?.length > 0 && node.children.find((c: any) => c.name === 'Story');
};

const generateMdxSource = (canvas: any) => {
  const babel = toBabel(cloneDeep(toEstree(canvas)));
  const { code } = generate(babel, {});
  return code.replace(/<\/?Canvas[^>]*>;?/g, '');
};

function extractExports(root: t.File, options: CompilerOptions) {
  const context: Context = {
    counter: 0,
    storyNameToKey: {},
    namedExports: {},
  };
  const storyExports = [];
  const includeStories = [];
  let metaExport: MetaExport | null = null;

  let contents: t.ExpressionStatement;
  root.program.body.forEach((child) => {
    if (t.isExpressionStatement(child) && t.isJSXFragment(child.expression)) {
      if (contents) throw new Error('duplicate contents');
      contents = child;
    } else if (
      t.isExportNamedDeclaration(child) &&
      t.isVariableDeclaration(child.declaration) &&
      child.declaration.declarations.length === 1
    ) {
      const declaration = child.declaration.declarations[0];
      if (t.isVariableDeclarator(declaration) && t.isIdentifier(declaration.id)) {
        const { name } = declaration.id;
        context.namedExports[name] = declaration.init;
      }
    }
  });
  if (contents) {
    const jsx = contents.expression as t.JSXFragment;
    jsx.children.forEach((child) => {
      if (t.isJSXElement(child)) {
        if (t.isJSXIdentifier(child.openingElement.name)) {
          const name = child.openingElement.name.name;
          let stories;
          if (['Canvas', 'Preview'].includes(name)) {
            stories = genCanvasExports(child, context);
          } else if (name === 'Story') {
            stories = genStoryExport(child, context);
          } else if (name === 'Meta') {
            const meta = genMeta(child, options);
            if (meta) {
              if (metaExport) {
                throw new Error('Meta can only be declared once');
              }
              metaExport = meta;
            }
          }
          if (stories) {
            Object.entries(stories).forEach(([key, story]) => {
              includeStories.push(key);
              storyExports.push(story);
            });
          }
        }
      } else if (t.isJSXExpressionContainer(child)) {
        // Skip string literals & other JSX expressions
      } else {
        throw new Error(`Unexpected JSX child: ${child.type}`);
      }
    });
  }

  if (metaExport) {
    if (!storyExports.length) {
      storyExports.push('export const __page = () => { throw new Error("Docs-only story"); };');
      storyExports.push('__page.parameters = { docsOnly: true };');
      includeStories.push('__page');
    }
  } else {
    metaExport = {};
  }
  metaExport.includeStories = JSON.stringify(includeStories);

  const fullJsx = [
    ...storyExports,
    `const componentMeta = ${stringifyMeta(metaExport)};`,
    wrapperJs,
    'export default componentMeta;',
  ].join('\n\n');

  return fullJsx;
}

export const genBabel = (store: any, root: any) => {
  const estree = store.toEstree(root);
  // toBabel mutates root, so we need to clone it
  const clone = cloneDeep(estree);
  const babel = toBabel(clone);
  return babel;
};

export const plugin = (store: any) => (root: any) => {
  const babel = genBabel(store, root);
  store.exports = extractExports(babel, {});

  // insert mdxSource attributes for canvas elements
  root.children.forEach((node: any) => {
    if (node.type === 'mdxJsxFlowElement' && node.name === 'Canvas') {
      if (!hasStoryChild(node)) {
        node.attributes = [
          ...(node.attributes || []),
          { type: 'mdxJsxAttribute', name: 'mdxSource', value: generateMdxSource(node) },
        ];
      }
    }
  });

  return root;
};

export const postprocess = (code: string, extractedExports: string) => {
  const lines = code.toString().trim().split('\n');

  // /*@jsxRuntime automatic @jsxImportSource react*/
  const first = lines.shift();

  return [
    ...lines.filter((line) => !line.match(/^export default/)),
    SEPARATOR,
    extractedExports,
  ].join('\n');
};

export const compile = async (
  input: string,
  { skipCsf = false, mdxCompileOptions = {}, jsxOptions = {} }: CompileOptions = {}
) => {
  const { options, context } = getCompilerOptionsAndContext(mdxCompileOptions, skipCsf);

  if (skipCsf) {
    const mdxResult = await mdxCompile(input, options);

    return mdxResult.toString();
  }

  const mdxResult = await mdxCompile(input, options);

  return transformJSXAsync(postprocess(mdxResult.toString(), context.exports), jsxOptions);
};

export const compileSync = (
  input: string,
  { skipCsf = false, mdxCompileOptions = {}, jsxOptions = {} }: CompileOptions = {}
) => {
  const { options, context } = getCompilerOptionsAndContext(mdxCompileOptions, skipCsf);

  if (skipCsf) {
    const mdxResult = mdxCompileSync(input, options);

    return mdxResult.toString();
  }

  const mdxResult = mdxCompileSync(input, options);

  return transformJSXSync(postprocess(mdxResult.toString(), context.exports), jsxOptions);
};

function getCompilerOptionsAndContext(
  mdxCompileOptions: MdxCompileOptions,
  skipCsf: boolean = false
): { options: MdxCompileOptions; context: any } {
  if (skipCsf) {
    return {
      options: {
        providerImportSource: '@mdx-js/react',
        rehypePlugins: [],
        ...mdxCompileOptions,
      },
      context: {},
    };
  }

  const context = { exports: '', toEstree };

  return {
    options: {
      providerImportSource: '@mdx-js/react',
      ...mdxCompileOptions,
      rehypePlugins: [...(mdxCompileOptions?.rehypePlugins || []), [plugin, context]],
      // preserve the JSX, we'll deal with it using babel
      jsx: true,
    },
    context,
  };
}
