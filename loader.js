const { plugin, postprocess } = require('./dist/cjs');

const DEFAULT_RENDERER = `
import React from 'react';
`;

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

const loader = async function (content) {
  const callback = this.async();
  // NOTE: this.getOptions() is webpack5 only
  // const queryOptions = this.getOptions()
  const options = {
    filepath: this.resourcePath,
  };

  let result;
  try {
    result = await compile(content);
  } catch (err) {
    return callback(err);
  }

  const code = `${DEFAULT_RENDERER}\n${result}`;
  return callback(null, code);
};

module.exports = loader;
