import { compile as mdxCompile } from '@mdx-js/mdx';
import { transformAsync } from '@babel/core';

export interface JSXOptions {
  pragma?: string;
  pragmaFrag?: string;
  throwIfNamespace?: false;
  runtime?: 'classic' | 'automatic';
  importSource?: string;
}

export type MdxCompileOptions = Parameters<typeof mdxCompile>[1];
export type BabelOptions = Parameters<typeof transformAsync>[1];

export interface CompileOptions {
  skipCsf?: boolean;
  mdxCompileOptions?: MdxCompileOptions;
  jsxOptions?: JSXOptions;
}
