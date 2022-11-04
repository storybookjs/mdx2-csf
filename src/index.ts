import { compile as mdxCompile, compileSync } from '@mdx-js/mdx';
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
  hasStoryChild,
  getMdxSource,
} from './sb-mdx-plugin';

export const SEPARATOR = '// =========';

export { wrapperJs };

export function getAllCanvasElements(exp: t.JSXFragment): t.JSXElement[] {
  return exp.children.filter(
    (child: any): child is t.JSXElement =>
      t.isJSXOpeningElement(child.openingElement) && child.openingElement.name.name === 'Canvas'
  );
}

export function getCanvasWithoutStoryElements(canvasContainers: t.JSXElement[]): t.JSXElement[] {
  return canvasContainers.filter((canvasContainer) => !hasStoryChild(canvasContainer));
}

export function addMdxSourceAttribute(canvasWithNoStoryContainers: t.JSXElement[]): void {
  canvasWithNoStoryContainers.map((canvasWithNoStoryContainer) =>
    canvasWithNoStoryContainer.openingElement.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('mdxSource'),
        t.stringLiteral(getMdxSource(canvasWithNoStoryContainer.children))
      )
    )
  );
}

function extractExports(root: t.File, options: CompilerOptions) {
  const context: Context = {
    counter: 0,
    storyNameToKey: {},
    namedExports: {},
  };
  const storyExports = [];
  const includeStories = [];
  let metaExport: MetaExport | null = null;
  const { code } = generate(root, {});
  let contents: t.ExpressionStatement;
  root.program.body.forEach((child) => {
    if (t.isExpressionStatement(child) && t.isJSXFragment(child.expression)) {
      if (contents) throw new Error('duplicate contents');

      // 1. find all `<Canvas>` elements.
      const canvasElements = getAllCanvasElements(child.expression);
      // 2. find all `<Canvas>` elements that have no `<Story>` children.
      const canvasWithNoStoryContainers = getCanvasWithoutStoryElements(canvasElements);
      // 3. add 'mdxSource' attribute mannually or it's `undefined`.
      addMdxSourceAttribute(canvasWithNoStoryContainers);

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

  return root;
};

export const postprocess = (code: string, extractedExports: string) => {
  const lines = code.toString().trim().split('\n');

  // /*@jsxRuntime automatic @jsxImportSource react*/
  const first = lines.shift();

  return [
    first,
    ...lines.filter((line) => !line.match(/^export default/)),
    SEPARATOR,
    extractedExports,
  ].join('\n');
};

export const mdxSync = (code: string) => {
  const store = { exports: '', toEstree };
  const output = compileSync(code, {
    rehypePlugins: [[plugin, store]],
  });
  return postprocess(output.toString(), store.exports);
};

export { mdxSync as compileSync };

export const compile = async (code: string, { skipCsf }: { skipCsf?: boolean } = {}) => {
  const store = { exports: '', toEstree };
  const output = await mdxCompile(code, {
    rehypePlugins: skipCsf ? [] : [[plugin, store]],
    providerImportSource: '@mdx-js/react',
  });
  return skipCsf ? output.toString() : postprocess(output.toString(), store.exports);
};
