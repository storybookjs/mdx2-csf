import * as t from '@babel/types';
import generate from '@babel/generator';
import camelCase from 'lodash/camelCase';
import jsStringEscape from 'js-string-escape';

// Defined in MDX2.0
interface MdxOptions {
  filepath?: string;
  skipExport?: boolean;
  wrapExport?: string;
  remarkPlugins?: any[];
  rehypePlugins?: any[];
}

export interface CompilerOptions {
  filepath?: string;
}

export interface Context {
  counter: number;
  namedExports: Record<string, any>;
  storyNameToKey: Record<string, string>;
}

interface HastElement {
  type: string;
  children: HastElement[];
  value: string;
}

export type MetaExport = Record<string, any>;

// Generate the MDX as is, but append named exports for every
// story in the contents

const RESERVED =
  /^(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|await|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$/;

function getAttr(elt: t.JSXOpeningElement, what: string): t.JSXAttribute['value'] | undefined {
  const attr = (elt.attributes as t.JSXAttribute[]).find((n) => n.name.name === what);
  return attr?.value;
}

const isReserved = (name: string) => RESERVED.exec(name);
const startsWithNumber = (name: string) => /^\d/.exec(name);

const sanitizeName = (name: string) => {
  let key = camelCase(name);
  if (startsWithNumber(key)) {
    key = `_${key}`;
  } else if (isReserved(key)) {
    key = `${key}Story`;
  }
  return key;
};

const getStoryKey = (name: string, counter: number) =>
  name ? sanitizeName(name) : `story${counter}`;

function genAttribute(key: string, element: t.JSXOpeningElement) {
  const value = getAttr(element, key);
  if (t.isJSXExpressionContainer(value)) {
    const { code } = generate(value.expression, {});
    return code;
  }
  return undefined;
}

function genImportStory(
  ast: t.JSXElement,
  storyDef: t.JSXExpressionContainer,
  storyName: string,
  context: Context
) {
  const { code: story } = generate(storyDef.expression, {});

  const storyKey = `_${story.split('.').pop()}_`;

  const statements = [`export const ${storyKey} = ${story};`];
  if (storyName) {
    context.storyNameToKey[storyName] = storyKey;
    statements.push(`${storyKey}.storyName = '${storyName}';`);
  } else {
    context.storyNameToKey[storyKey] = storyKey;
    ast.openingElement.attributes.push(
      t.jsxAttribute(t.jsxIdentifier('name'), t.stringLiteral(storyKey))
    );
  }
  return {
    [storyKey]: statements.join('\n'),
  };
}

function getBodyPart(bodyNode: t.Node, context: Context) {
  const body = t.isJSXExpressionContainer(bodyNode) ? bodyNode.expression : bodyNode;
  let sourceBody = body;
  if (
    t.isCallExpression(body) &&
    t.isMemberExpression(body.callee) &&
    t.isIdentifier(body.callee.object) &&
    t.isIdentifier(body.callee.property) &&
    body.callee.property.name === 'bind' &&
    (body.arguments.length === 0 ||
      (body.arguments.length === 1 &&
        t.isObjectExpression(body.arguments[0]) &&
        body.arguments[0].properties.length === 0))
  ) {
    const bound = body.callee.object.name;
    const namedExport = context.namedExports[bound];
    if (namedExport) {
      sourceBody = namedExport;
    }
  }

  const { code: storyCode } = generate(body, {});
  const { code: sourceCode } = generate(sourceBody, {});
  return { storyCode, sourceCode, body };
}

const idOrNull = (attr: t.JSXAttribute['value']) => (t.isStringLiteral(attr) ? attr.value : null);
const expressionOrNull = (attr: t.JSXAttribute['value']) =>
  t.isJSXExpressionContainer(attr) ? attr.expression : null;

export function genStoryExport(ast: t.JSXElement, context: Context) {
  if (getAttr(ast.openingElement, 'of')) {
    throw new Error(`The 'of' prop is not supported in .stories.mdx files, only .mdx files.
    See https://storybook.js.org/docs/7.0/react/writing-docs/mdx on how to write MDX files and stories separately.`);
  }

  const storyName = idOrNull(getAttr(ast.openingElement, 'name'));
  const storyId = idOrNull(getAttr(ast.openingElement, 'id'));
  const storyRef = getAttr(ast.openingElement, 'story') as t.JSXExpressionContainer;

  if (!storyId && !storyName && !storyRef) {
    throw new Error('Expected a Story name, id, or story attribute');
  }

  // We don't generate exports for story references or the smart "current story"
  if (storyId) {
    return null;
  }

  if (storyRef) {
    return genImportStory(ast, storyRef, storyName, context);
  }

  const statements = [];
  const storyKey = getStoryKey(storyName, context.counter);

  const bodyNodes = ast.children.filter((n) => !t.isJSXText(n));
  let storyCode = null;
  let sourceCode = null;
  let storyVal = null;
  if (!bodyNodes.length) {
    if (ast.children.length > 0) {
      // plain text node
      const { code } = generate(ast.children[0], {});
      storyCode = `'${code}'`;
      sourceCode = storyCode;
      storyVal = `() => (
        ${storyCode}
      )`;
    } else {
      sourceCode = '{}';
      storyVal = '{}';
    }
  } else {
    const bodyParts = bodyNodes.map((bodyNode) => getBodyPart(bodyNode, context));
    // if we have more than two children
    // 1. Add line breaks
    // 2. Enclose in <> ... </>
    storyCode = bodyParts.map(({ storyCode: code }) => code).join('\n');
    sourceCode = bodyParts.map(({ sourceCode: code }) => code).join('\n');
    const storyReactCode = bodyParts.length > 1 ? `<>\n${storyCode}\n</>` : storyCode;
    // keep track if an identifier or function call
    // avoid breaking change for 5.3
    const BIND_REGEX = /\.bind\(.*\)/;
    if (bodyParts.length === 1) {
      if (BIND_REGEX.test(bodyParts[0].storyCode)) {
        storyVal = bodyParts[0].storyCode;
      } else if (t.isIdentifier(bodyParts[0].body)) {
        storyVal = `assertIsFn(${storyCode})`;
      } else if (t.isArrowFunctionExpression(bodyParts[0].body)) {
        storyVal = `(${storyCode})`;
      } else {
        storyVal = `() => (
          ${storyReactCode}
        )`;
      }
    } else {
      storyVal = `() => (
        ${storyReactCode}
      )`;
    }
  }

  statements.push(`export const ${storyKey} = ${storyVal};`);

  // always preserve the name, since CSF exports can get modified by displayName
  statements.push(`${storyKey}.storyName = '${storyName}';`);

  const argTypes = genAttribute('argTypes', ast.openingElement);
  if (argTypes) statements.push(`${storyKey}.argTypes = ${argTypes};`);

  const args = genAttribute('args', ast.openingElement);
  if (args) statements.push(`${storyKey}.args = ${args};`);

  const parameters = expressionOrNull(getAttr(ast.openingElement, 'parameters'));
  const source = jsStringEscape(sourceCode);
  const sourceParam = `storySource: { source: '${source}' }`;
  if (parameters) {
    const { code: params } = generate(parameters, {});
    statements.push(`${storyKey}.parameters = { ${sourceParam}, ...${params} };`);
  } else {
    statements.push(`${storyKey}.parameters = { ${sourceParam} };`);
  }

  const decorators = expressionOrNull(getAttr(ast.openingElement, 'decorators'));
  if (decorators) {
    const { code: decos } = generate(decorators, {});
    statements.push(`${storyKey}.decorators = ${decos};`);
  }

  const loaders = expressionOrNull(getAttr(ast.openingElement, 'loaders'));
  if (loaders) {
    const { code: loaderCode } = generate(loaders, {});
    statements.push(`${storyKey}.loaders = ${loaderCode};`);
  }

  const play = expressionOrNull(getAttr(ast.openingElement, 'play'));
  if (play) {
    const { code: playCode } = generate(play, {});
    statements.push(`${storyKey}.play = ${playCode};`);
  }

  const render = expressionOrNull(getAttr(ast.openingElement, 'render'));
  if (render) {
    const { code: renderCode } = generate(render, {});
    statements.push(`${storyKey}.render = ${renderCode};`);
  }

  context.storyNameToKey[storyName] = storyKey;

  return {
    [storyKey]: statements.join('\n'),
  };
}

export function genCanvasExports(ast: t.JSXElement, context: Context) {
  const canvasExports = {};
  for (let i = 0; i < ast.children.length; i += 1) {
    const child = ast.children[i];
    if (
      t.isJSXElement(child) &&
      t.isJSXIdentifier(child.openingElement.name) &&
      child.openingElement.name.name === 'Story'
    ) {
      const storyExport = genStoryExport(child, context);
      const { code } = generate(child, {});
      // @ts-ignore
      child.value = code;
      if (storyExport) {
        Object.assign(canvasExports, storyExport);
        context.counter += 1;
      }
    }
  }
  return canvasExports;
}

export function genMeta(ast: t.JSXElement, options: CompilerOptions) {
  if (getAttr(ast.openingElement, 'of')) {
    throw new Error(`The 'of' prop is not supported in .stories.mdx files, only .mdx files.
    See https://storybook.js.org/docs/7.0/react/writing-docs/mdx on how to write MDX files and stories separately.`);
  }

  const titleAttr = getAttr(ast.openingElement, 'title');
  const idAttr = getAttr(ast.openingElement, 'id');
  let title = null;
  if (titleAttr) {
    if (t.isStringLiteral(titleAttr)) {
      title = "'".concat(jsStringEscape(titleAttr.value), "'");
    } else if (t.isJSXExpressionContainer(titleAttr)) {
      try {
        // generate code, so the expression is evaluated by the CSF compiler
        const { code } = generate(titleAttr.expression, {});
        // remove the curly brackets at start and end of code
        title = code.replace(/^\{(.+)\}$/, '$1');
      } catch (e) {
        // eat exception if title parsing didn't go well
        // eslint-disable-next-line no-console
        console.warn('Invalid title:', options.filepath);
        title = undefined;
      }
    } else {
      console.warn(`Unknown title attr: ${titleAttr.type}`);
    }
  }
  const id = t.isStringLiteral(idAttr) ? `'${idAttr.value}'` : null;
  const parameters = genAttribute('parameters', ast.openingElement);
  const decorators = genAttribute('decorators', ast.openingElement);
  const loaders = genAttribute('loaders', ast.openingElement);
  const component = genAttribute('component', ast.openingElement);
  const subcomponents = genAttribute('subcomponents', ast.openingElement);
  const args = genAttribute('args', ast.openingElement);
  const argTypes = genAttribute('argTypes', ast.openingElement);
  const render = genAttribute('render', ast.openingElement);

  return {
    title,
    id,
    parameters,
    decorators,
    loaders,
    component,
    subcomponents,
    args,
    argTypes,
    render,
    tags: "['stories-mdx']",
  };
}

export const wrapperJs = `
componentMeta.parameters = componentMeta.parameters || {};
componentMeta.parameters.docs = {
  ...(componentMeta.parameters.docs || {}),
  page: MDXContent,
};
`.trim();

// Use this rather than JSON.stringify because `Meta`'s attributes
// are already valid code strings, so we want to insert them raw
// rather than add an extra set of quotes
export function stringifyMeta(meta: object) {
  let result = '{ ';
  Object.entries(meta).forEach(([key, val]) => {
    if (val) {
      result += `${key}: ${val}, `;
    }
  });
  result += ' }';
  return result;
}
