const { plugin, postprocess } = require('./dist/cjs');

const compile = async (code) => {
  // This async import is needed because these libraries are ESM
  // and this file is CJS. Furthermore, we keep this file out of
  // the src directory so that babel doesn't turn these into `require`
  // statements when it transpiles...
  const { compile } = await import('@mdx-js/mdx');
  const { toEstree } = await import('hast-util-to-estree');

  const store = { exports: '', toEstree };
  const output = await compile(code, { rehypePlugins: [[plugin, store]] });
  const processed = postprocess(output.toString(), store.exports);
  return processed;
};

module.exports = { compile };
