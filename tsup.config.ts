import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./src/index.ts'],
    format: 'cjs',
    esbuildOptions(options, context) {
      options.platform = 'node';
    },
  },
  {
    entry: ['./src/index.ts'],
    format: 'esm',
    dts: {
      entry: ['./src/index.ts'],
      resolve: true,
    },
    esbuildOptions(options, context) {
      options.platform = 'node';
      options.banner = {
        js:
          "import { createRequire as topLevelCreateRequire } from 'module';\n const require = topLevelCreateRequire(import" +
          '.meta.url);',
      };
    },
  },
]);
