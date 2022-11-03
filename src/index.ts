import { compile as mdxCompile } from '@mdx-js/mdx';
import { toEstree } from 'hast-util-to-estree';
import { plugin, postprocess } from './mdx2';

export * from './mdx2';

export const compile = async (code: string, { skipCsf }: { skipCsf?: boolean }) => {
  // This async import is needed because these libraries are ESM
  // and this file is CJS. Furthermore, we keep this file out of
  // the src directory so that babel doesn't turn these into `require`
  // statements when it transpiles...

  const store = { exports: '', toEstree };

  const output = await mdxCompile(code, {
    rehypePlugins: skipCsf ? [] : [[plugin, store]],
    providerImportSource: '@mdx-js/react',
  });
  return skipCsf ? output.toString() : postprocess(output.toString(), store.exports);
};
