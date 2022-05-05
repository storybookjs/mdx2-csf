module.exports = {
  stories: ['../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', { name: '@storybook/addon-essentials' }],
  framework: '@storybook/react',
  core: { builder: 'webpack5' },
  webpackFinal: async (config) => {
    const rules = (config.module.rules || []).filter(
      (rule) => !rule.test?.toString().endsWith('\\.mdx$/')
    );
    rules.push({
      // 2a. Load `.stories.mdx` / `.story.mdx` files as CSF and generate
      //     the docs page from the markdown
      test: /\.(stories|story)\.mdx$/,

      use: [
        {
          // Need to add babel-loader as dependency: `yarn add -D babel-loader`
          loader: require.resolve('babel-loader'),
          // may or may not need this line depending on your app's setup
          options: {
            plugins: ['@babel/plugin-transform-react-jsx'],
          },
        },
        {
          loader: require.resolve('../loader'),
        },
      ],
    });
    config.module.rules = rules;
    return config;
  },
};
