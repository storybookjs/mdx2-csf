import { transformAsync, transformSync } from '@babel/core';
// @ts-expect-error (no types, but perfectly valid)
import presetReact from '@babel/preset-react';
import type { JSXOptions, BabelOptions } from './types';

function getBabelOptions(jsxOptions: JSXOptions): BabelOptions {
  return {
    filename: 'file.js',
    sourceType: 'module',
    presets: [
      [
        presetReact,
        {
          runtime: 'automatic',
          ...jsxOptions,
        },
      ],
    ],
  };
}

export const transformJSXAsync = async (input: string, jsxOptions: JSXOptions) => {
  const babelOptions = getBabelOptions(jsxOptions);
  const { code } = await transformAsync(input, babelOptions);

  return code;
};

export const transformJSXSync = (input: string, jsxOptions: JSXOptions) => {
  const babelOptions = getBabelOptions(jsxOptions);
  const { code } = transformSync(input, babelOptions);

  return code;
};
