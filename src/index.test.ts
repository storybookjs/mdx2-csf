import { dedent } from 'ts-dedent';
import prettier from 'prettier';
import { compileSync, compile, SEPARATOR, wrapperJs } from './index';

// @ts-ignore
expect.addSnapshotSerializer({
  print: (val: any) => val,
  test: (val) => true,
});

const clean = (mdx: string) => {
  const code = compileSync(mdx);
  const trimmed = code.split(SEPARATOR)[1].split(wrapperJs)[0];

  return prettier
    .format(trimmed, {
      parser: 'babel',
      printWidth: 100,
      tabWidth: 2,
      bracketSpacing: true,
      trailingComma: 'es5',
      singleQuote: true,
    })
    .trim();
};

describe('mdx2', () => {
  it('works', () => {
    const input = dedent`
      # hello

      <Meta title="foobar" />

      world {2 + 1}

      <Story name="foo">bar</Story>
    `;
    // @ts-ignore
    expect(clean(input)).toMatchInlineSnapshot(`
      const foo = () => 'bar';

      exports.foo = foo;
      foo.storyName = 'foo';
      foo.parameters = {
        storySource: {
          source: '"bar"',
        },
      };
      const componentMeta = {
        title: 'foobar',
        tags: ['mdx'],
        includeStories: ['foo'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('standalone jsx expressions', () => {
    expect(
      clean(dedent`
        # Standalone JSX expressions

        {3 + 3}
      `)
    ).toMatchInlineSnapshot(`
      const componentMeta = {
        includeStories: [],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });
});

describe('full snapshots', () => {
  it('compileSync', () => {
    const input = dedent`
      # hello

      <Meta title="foobar" />

      world {2 + 1}

      <Story name="foo">bar</Story>
    `;
    // @ts-ignore
    expect(compileSync(input)).toMatchInlineSnapshot(`
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = exports.foo = void 0;

      var _react = require("@mdx-js/react");

      var _jsxRuntime = require("react/jsx-runtime");

      function MDXContent(props = {}) {
        const {
          wrapper: MDXLayout
        } = Object.assign({}, (0, _react.useMDXComponents)(), props.components);
        return MDXLayout ? /*#__PURE__*/(0, _jsxRuntime.jsx)(MDXLayout, { ...props,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_createMdxContent, {})
        }) : _createMdxContent();

        function _createMdxContent() {
          const _components = Object.assign({
            h1: "h1",
            p: "p"
          }, (0, _react.useMDXComponents)(), props.components),
                {
            Meta,
            Story
          } = _components;

          if (!Meta) _missingMdxReference("Meta", true);
          if (!Story) _missingMdxReference("Story", true);
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_components.h1, {
              children: "hello"
            }), "\\n", /*#__PURE__*/(0, _jsxRuntime.jsx)(Meta, {
              title: "foobar"
            }), "\\n", /*#__PURE__*/(0, _jsxRuntime.jsxs)(_components.p, {
              children: ["world ", 2 + 1]
            }), "\\n", /*#__PURE__*/(0, _jsxRuntime.jsx)(Story, {
              name: "foo",
              children: "bar"
            })]
          });
        }
      }

      function _missingMdxReference(id, component) {
        throw new Error("Expected " + (component ? "component" : "object") + " \`" + id + "\` to be defined: you likely forgot to import, pass, or provide it.");
      }
      /* ========= */


      const foo = () => "bar";

      exports.foo = foo;
      foo.storyName = 'foo';
      foo.parameters = {
        storySource: {
          source: '\\"bar\\"'
        }
      };
      const componentMeta = {
        title: 'foobar',
        tags: ['mdx'],
        includeStories: ["foo"]
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}),
        page: MDXContent
      };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });
  it('compile', async () => {
    const input = dedent`
      # hello

      <Meta title="foobar" />

      world {2 + 1}

      <Story name="foo">bar</Story>
    `;
    // @ts-ignore
    expect(await compile(input)).toMatchInlineSnapshot(`
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = exports.foo = void 0;

      var _react = require("@mdx-js/react");

      var _jsxRuntime = require("react/jsx-runtime");

      function MDXContent(props = {}) {
        const {
          wrapper: MDXLayout
        } = Object.assign({}, (0, _react.useMDXComponents)(), props.components);
        return MDXLayout ? /*#__PURE__*/(0, _jsxRuntime.jsx)(MDXLayout, { ...props,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_createMdxContent, {})
        }) : _createMdxContent();

        function _createMdxContent() {
          const _components = Object.assign({
            h1: "h1",
            p: "p"
          }, (0, _react.useMDXComponents)(), props.components),
                {
            Meta,
            Story
          } = _components;

          if (!Meta) _missingMdxReference("Meta", true);
          if (!Story) _missingMdxReference("Story", true);
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_components.h1, {
              children: "hello"
            }), "\\n", /*#__PURE__*/(0, _jsxRuntime.jsx)(Meta, {
              title: "foobar"
            }), "\\n", /*#__PURE__*/(0, _jsxRuntime.jsxs)(_components.p, {
              children: ["world ", 2 + 1]
            }), "\\n", /*#__PURE__*/(0, _jsxRuntime.jsx)(Story, {
              name: "foo",
              children: "bar"
            })]
          });
        }
      }

      function _missingMdxReference(id, component) {
        throw new Error("Expected " + (component ? "component" : "object") + " \`" + id + "\` to be defined: you likely forgot to import, pass, or provide it.");
      }
      /* ========= */


      const foo = () => "bar";

      exports.foo = foo;
      foo.storyName = 'foo';
      foo.parameters = {
        storySource: {
          source: '\\"bar\\"'
        }
      };
      const componentMeta = {
        title: 'foobar',
        tags: ['mdx'],
        includeStories: ["foo"]
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}),
        page: MDXContent
      };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });
  it('sync & async should match', async () => {
    const input = dedent`
    # hello

    <Meta title="foobar" />

    world {2 + 1}

    <Story name="foo">bar</Story>
  `;
    // @ts-ignore
    const ou1 = compileSync(input);
    const ou2 = await compile(input);

    expect(ou1).toEqual(ou2);
  });

  it('canvas with story', () => {
    const input = dedent`
      import { Canvas, Meta, Story } from '@storybook/addon-docs';

      <Meta title="MDX/Badge" />

      <Canvas>
        <Story name="foo">
          <div>I'm a story</div>
        </Story>
      </Canvas>
    `;
    expect(compileSync(input)).toMatchInlineSnapshot(`
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = exports.foo = void 0;

      var _react = require("@mdx-js/react");

      var _addonDocs = require("@storybook/addon-docs");

      var _jsxRuntime = require("react/jsx-runtime");

      function MDXContent(props = {}) {
        const {
          wrapper: MDXLayout
        } = Object.assign({}, (0, _react.useMDXComponents)(), props.components);
        return MDXLayout ? /*#__PURE__*/(0, _jsxRuntime.jsx)(MDXLayout, { ...props,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_createMdxContent, {})
        }) : _createMdxContent();

        function _createMdxContent() {
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_addonDocs.Meta, {
              title: "MDX/Badge"
            }), "\\n", /*#__PURE__*/(0, _jsxRuntime.jsx)(_addonDocs.Canvas, {
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_addonDocs.Story, {
                name: "foo",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  children: "I'm a story"
                })
              })
            })]
          });
        }
      }
      /* ========= */


      const foo = () => /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        children: "I'm a story"
      });

      exports.foo = foo;
      foo.storyName = 'foo';
      foo.parameters = {
        storySource: {
          source: '<div>{\\"I\\'m a story\\"}</div>'
        }
      };
      const componentMeta = {
        title: 'MDX/Badge',
        tags: ['mdx'],
        includeStories: ["foo"]
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}),
        page: MDXContent
      };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('canvas without story children', () => {
    const input = dedent`
      import { Canvas } from '@storybook/addon-docs';

      <Canvas>
        <h2>Some here</h2>
      </Canvas>
    `;
    expect(compileSync(input)).toMatchInlineSnapshot(`
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;

      var _react = require("@mdx-js/react");

      var _addonDocs = require("@storybook/addon-docs");

      var _jsxRuntime = require("react/jsx-runtime");

      function MDXContent(props = {}) {
        const {
          wrapper: MDXLayout
        } = Object.assign({}, (0, _react.useMDXComponents)(), props.components);
        return MDXLayout ? /*#__PURE__*/(0, _jsxRuntime.jsx)(MDXLayout, { ...props,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_createMdxContent, {})
        }) : _createMdxContent();

        function _createMdxContent() {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(_addonDocs.Canvas, {
            mdxSource: "<h2>{\\"Some here\\"}</h2>",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
              children: "Some here"
            })
          });
        }
      }
      /* ========= */


      const componentMeta = {
        includeStories: []
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}),
        page: MDXContent
      };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });
});

describe('docs-mdx-compiler-plugin', () => {
  it('component-args.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" args={{ a: 1, b: 2 }} argTypes={{ a: { name: 'A' }, b: { name: 'B' } }} />

        # Args

        <Story name="component notes">
          <Button>Component notes</Button>
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const componentNotes = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'Component notes',
        });

      exports.componentNotes = componentNotes;
      componentNotes.storyName = 'component notes';
      componentNotes.parameters = {
        storySource: {
          source: '<Button>{"Component notes"}</Button>',
        },
      };
      const componentMeta = {
        title: 'Button',
        args: {
          a: 1,
          b: 2,
        },
        argTypes: {
          a: {
            name: 'A',
          },
          b: {
            name: 'B',
          },
        },
        tags: ['mdx'],
        includeStories: ['componentNotes'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('component-id.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" component={Button} id="button-id" />

        <Story name="component notes">
          <Button>Component notes</Button>
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const componentNotes = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'Component notes',
        });

      exports.componentNotes = componentNotes;
      componentNotes.storyName = 'component notes';
      componentNotes.parameters = {
        storySource: {
          source: '<Button>{"Component notes"}</Button>',
        },
      };
      const componentMeta = {
        title: 'Button',
        id: 'button-id',
        component: _demo.Button,
        tags: ['mdx'],
        includeStories: ['componentNotes'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('csf-imports.mdx', () => {
    expect(
      clean(dedent`
        import { Story, Meta, Canvas } from '@storybook/addon-docs';
        import { Welcome, Button } from '@storybook/angular/demo';
        import * as MyStories from './My.stories';
        import { Other } from './Other.stories';

        <Meta title="MDX/CSF imports" />

        # Stories from CSF imports

        <Story story={MyStories.Basic} />

        <Canvas>
          <Story story={Other} />
        </Canvas>

        <Story name="renamed" story={MyStories.Foo} />
      `)
    ).toMatchInlineSnapshot(`
      const _Basic_ = MyStories.Basic;
      exports._Basic_ = _Basic_;
      const _Other_ = _Other.Other;
      exports._Other_ = _Other_;
      const _Foo_ = MyStories.Foo;
      exports._Foo_ = _Foo_;
      _Foo_.storyName = 'renamed';
      const componentMeta = {
        title: 'MDX/CSF imports',
        tags: ['mdx'],
        includeStories: ['_Basic_', '_Other_', '_Foo_'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('decorators.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta
          title="Button"
          decorators={[(storyFn) => <div style={{ backgroundColor: 'yellow' }}>{storyFn()}</div>]}
        />

        # Decorated story

        <Story name="one" decorators={[(storyFn) => <div className="local">{storyFn()}</div>]}>
          <Button>One</Button>
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const one = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'One',
        });

      exports.one = one;
      one.storyName = 'one';
      one.parameters = {
        storySource: {
          source: '<Button>{"One"}</Button>',
        },
      };
      one.decorators = [
        (storyFn) =>
          /*#__PURE__*/ (0, _jsxRuntime.jsx)('div', {
            className: 'local',
            children: storyFn(),
          }),
      ];
      const componentMeta = {
        title: 'Button',
        decorators: [
          (storyFn) =>
            /*#__PURE__*/ (0, _jsxRuntime.jsx)('div', {
              style: {
                backgroundColor: 'yellow',
              },
              children: storyFn(),
            }),
        ],
        tags: ['mdx'],
        includeStories: ['one'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('docs-only.mdx', () => {
    expect(
      clean(dedent`
        import { Meta } from '@storybook/addon-docs';

        <Meta title="docs-only" />

        # Documentation only

        This is a documentation-only MDX file which cleans a dummy 'docsOnly: true' story.
      `)
    ).toMatchInlineSnapshot(`
      const __page = () => {
        throw new Error('Docs-only story');
      };

      exports.__page = __page;
      __page.parameters = {
        docsOnly: true,
      };
      const componentMeta = {
        title: 'docs-only',
        tags: ['mdx'],
        includeStories: ['__page'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('loaders.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" loaders={[async () => ({ foo: 1 })]} />

        # Story with loader

        <Story name="one" loaders={[async () => ({ bar: 2 })]}>
          <Button>One</Button>
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const one = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'One',
        });

      exports.one = one;
      one.storyName = 'one';
      one.parameters = {
        storySource: {
          source: '<Button>{"One"}</Button>',
        },
      };
      one.loaders = [
        async () => ({
          bar: 2,
        }),
      ];
      const componentMeta = {
        title: 'Button',
        loaders: [
          async () => ({
            foo: 1,
          }),
        ],
        tags: ['mdx'],
        includeStories: ['one'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('meta-quotes-in-title.mdx', () => {
    expect(
      clean(dedent`
        import { Meta } from '@storybook/addon-docs';

        <Meta title="Addons/Docs/what's in a title?" />
      `)
    ).toMatchInlineSnapshot(`
      const __page = () => {
        throw new Error('Docs-only story');
      };

      exports.__page = __page;
      __page.parameters = {
        docsOnly: true,
      };
      const componentMeta = {
        title: "Addons/Docs/what's in a title?",
        tags: ['mdx'],
        includeStories: ['__page'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('non-story-exports.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" />

        # Story definition

        <Story name="one">
          <Button>One</Button>
        </Story>

        export const two = 2;

        <Story name="hello story">
          <Button>Hello button</Button>
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const one = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'One',
        });

      exports.one = one;
      one.storyName = 'one';
      one.parameters = {
        storySource: {
          source: '<Button>{"One"}</Button>',
        },
      };

      const helloStory = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'Hello button',
        });

      exports.helloStory = helloStory;
      helloStory.storyName = 'hello story';
      helloStory.parameters = {
        storySource: {
          source: '<Button>{"Hello button"}</Button>',
        },
      };
      const componentMeta = {
        title: 'Button',
        tags: ['mdx'],
        includeStories: ['one', 'helloStory'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('parameters.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" component={Button} parameters={{ notes: 'component notes' }} />

        <Story name="component notes">
          <Button>Component notes</Button>
        </Story>

        <Story name="story notes" parameters={{ notes: 'story notes' }}>
          <Button>Story notes</Button>
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const componentNotes = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'Component notes',
        });

      exports.componentNotes = componentNotes;
      componentNotes.storyName = 'component notes';
      componentNotes.parameters = {
        storySource: {
          source: '<Button>{"Component notes"}</Button>',
        },
      };

      const storyNotes = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'Story notes',
        });

      exports.storyNotes = storyNotes;
      storyNotes.storyName = 'story notes';
      storyNotes.parameters = {
        storySource: {
          source: '<Button>{"Story notes"}</Button>',
        },
        ...{
          notes: 'story notes',
        },
      };
      const componentMeta = {
        title: 'Button',
        parameters: {
          notes: 'component notes',
        },
        component: _demo.Button,
        tags: ['mdx'],
        includeStories: ['componentNotes', 'storyNotes'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('previews.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Canvas, Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" component={Button} parameters={{ notes: 'component notes' }} />

        # Canvas

        Canvases can contain normal components, stories, and story references

        <Canvas>
          <Button>Just a button</Button>
          <Story name="hello button">
            <Button>Hello button</Button>
          </Story>
          <Story name="two">
            <Button>Two</Button>
          </Story>
          <Story id="welcome--welcome" />
        </Canvas>

        Canvas without a story

        <Canvas>
          <Button>Just a button</Button>
        </Canvas>
      `)
    ).toMatchInlineSnapshot(`
      const helloButton = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'Hello button',
        });

      exports.helloButton = helloButton;
      helloButton.storyName = 'hello button';
      helloButton.parameters = {
        storySource: {
          source: '<Button>{"Hello button"}</Button>',
        },
      };

      const two = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'Two',
        });

      exports.two = two;
      two.storyName = 'two';
      two.parameters = {
        storySource: {
          source: '<Button>{"Two"}</Button>',
        },
      };
      const componentMeta = {
        title: 'Button',
        parameters: {
          notes: 'component notes',
        },
        component: _demo.Button,
        tags: ['mdx'],
        includeStories: ['helloButton', 'two'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-args.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" />

        # Args

        export const Template = (args) => <Button>Component notes</Button>;

        <Story
          name="component notes"
          args={{ a: 1, b: 2 }}
          argTypes={{ a: { name: 'A' }, b: { name: 'B' } }}
        >
          {Template.bind({})}
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const componentNotes = Template.bind({});
      exports.componentNotes = componentNotes;
      componentNotes.storyName = 'component notes';
      componentNotes.argTypes = {
        a: {
          name: 'A',
        },
        b: {
          name: 'B',
        },
      };
      componentNotes.args = {
        a: 1,
        b: 2,
      };
      componentNotes.parameters = {
        storySource: {
          source: 'args => <Button>Component notes</Button>',
        },
      };
      const componentMeta = {
        title: 'Button',
        tags: ['mdx'],
        includeStories: ['componentNotes'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-current.mdx', () => {
    expect(
      clean(dedent`
        import { Story } from '@storybook/addon-docs';

        # Current story

        <Story id="." />
      `)
    ).toMatchInlineSnapshot(`
      const componentMeta = {
        includeStories: [],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-def-text-only.mdx', () => {
    expect(
      clean(dedent`
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Text" />

        # Story definition

        <Story name="text">Plain text</Story>
      `)
    ).toMatchInlineSnapshot(`
      const text = () => 'Plain text';

      exports.text = text;
      text.storyName = 'text';
      text.parameters = {
        storySource: {
          source: '"Plain text"',
        },
      };
      const componentMeta = {
        title: 'Text',
        tags: ['mdx'],
        includeStories: ['text'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-definitions.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" />

        # Story definition

        <Story name="one">
          <Button>One</Button>
        </Story>

        <Story name="hello story">
          <Button>Hello button</Button>
        </Story>

        <Story name="w/punctuation">
          <Button>with punctuation</Button>
        </Story>

        <Story name="1 fine day">
          <Button>starts with number</Button>
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const one = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'One',
        });

      exports.one = one;
      one.storyName = 'one';
      one.parameters = {
        storySource: {
          source: '<Button>{"One"}</Button>',
        },
      };

      const helloStory = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'Hello button',
        });

      exports.helloStory = helloStory;
      helloStory.storyName = 'hello story';
      helloStory.parameters = {
        storySource: {
          source: '<Button>{"Hello button"}</Button>',
        },
      };

      const wPunctuation = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'with punctuation',
        });

      exports.wPunctuation = wPunctuation;
      wPunctuation.storyName = 'w/punctuation';
      wPunctuation.parameters = {
        storySource: {
          source: '<Button>{"with punctuation"}</Button>',
        },
      };

      const _1FineDay = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
          children: 'starts with number',
        });

      exports._1FineDay = _1FineDay;
      _1FineDay.storyName = '1 fine day';
      _1FineDay.parameters = {
        storySource: {
          source: '<Button>{"starts with number"}</Button>',
        },
      };
      const componentMeta = {
        title: 'Button',
        tags: ['mdx'],
        includeStories: ['one', 'helloStory', 'wPunctuation', '_1FineDay'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-function-var.mdx', () => {
    expect(
      clean(dedent`
        import { Meta, Story } from '@storybook/addon-docs';

        <Meta title="story-function-var" />

        export const basicFn = () => <Button />;

        # Button

        I can define a story with the function defined in CSF:

        <Story name="basic">{basicFn}</Story>
      `)
    ).toMatchInlineSnapshot(`
      const basic = assertIsFn(basicFn);
      exports.basic = basic;
      basic.storyName = 'basic';
      basic.parameters = {
        storySource: {
          source: 'basicFn',
        },
      };
      const componentMeta = {
        title: 'story-function-var',
        tags: ['mdx'],
        includeStories: ['basic'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-function.mdx', () => {
    expect(
      clean(dedent`
        <Story name="function" height="100px">
          {() => {
            const btn = document.createElement('button');
            btn.innerHTML = 'Hello Button';
            btn.addEventListener('click', action('Click'));
            return btn;
          }}
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const functionStory = () => {
        const btn = document.createElement('button');
        btn.innerHTML = 'Hello Button';
        btn.addEventListener('click', action('Click'));
        return btn;
      };

      exports.functionStory = functionStory;
      functionStory.storyName = 'function';
      functionStory.parameters = {
        storySource: {
          source:
            '() => {\\n  const btn = document.createElement("button");\\n  btn.innerHTML = "Hello Button";\\n  btn.addEventListener("click", action("Click"));\\n  return btn;\\n}',
        },
      };
      const componentMeta = {
        includeStories: ['functionStory'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-multiple-children.mdx', () => {
    expect(
      clean(dedent`
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Multiple" />

        # Multiple children

        <Story name="multiple children">
          <p>Hello Child #1</p>
          <p>Hello Child #2</p>
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const multipleChildren = () =>
        /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
          children: [
            /*#__PURE__*/ (0, _jsxRuntime.jsx)('p', {
              children: 'Hello Child #1',
            }),
            '"\\\\n"',
            /*#__PURE__*/ (0, _jsxRuntime.jsx)('p', {
              children: 'Hello Child #2',
            }),
          ],
        });

      exports.multipleChildren = multipleChildren;
      multipleChildren.storyName = 'multiple children';
      multipleChildren.parameters = {
        storySource: {
          source: '<p>{"Hello Child #1"}</p>\\n"\\\\n"\\n<p>{"Hello Child #2"}</p>',
        },
      };
      const componentMeta = {
        title: 'Multiple',
        tags: ['mdx'],
        includeStories: ['multipleChildren'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-object.mdx', () => {
    expect(
      clean(dedent`
        import { Story, Meta } from '@storybook/addon-docs';
        import { Welcome, Button } from '@storybook/angular/demo';
        import { linkTo } from '@storybook/addon-links';

        <Meta title="MDX|Welcome" />

        # Story object

        <Story name="to storybook" height="300px">
          {{
            template: '<storybook-welcome-component (showApp)="showApp()"></storybook-welcome-component>',
            props: {
              showApp: linkTo('Button'),
            },
            moduleMetadata: {
              declarations: [Welcome],
            },
          }}
        </Story>
      `)
    ).toMatchInlineSnapshot(`
      const toStorybook = () => ({
        template: '<storybook-welcome-component (showApp)="showApp()"></storybook-welcome-component>',
        props: {
          showApp: (0, _addonLinks.linkTo)('Button'),
        },
        moduleMetadata: {
          declarations: [_demo.Welcome],
        },
      });

      exports.toStorybook = toStorybook;
      toStorybook.storyName = 'to storybook';
      toStorybook.parameters = {
        storySource: {
          source:
            '{\\n  template: "<storybook-welcome-component (showApp)=\\\\"showApp()\\\\"></storybook-welcome-component>",\\n  props: {\\n    showApp: linkTo("Button")\\n  },\\n  moduleMetadata: {\\n    declarations: [Welcome]\\n  }\\n}',
        },
      };
      const componentMeta = {
        title: 'MDX|Welcome',
        tags: ['mdx'],
        includeStories: ['toStorybook'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('story-references.mdx', () => {
    expect(
      clean(dedent`
        import { Story } from '@storybook/addon-docs';

        # Story reference

        <Story id="welcome--welcome" />
      `)
    ).toMatchInlineSnapshot(`
      const componentMeta = {
        includeStories: [],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('title-template-string.mdx', () => {
    expect(
      clean(
        [
          "import { Meta, Story } from '@storybook/addon-docs';",
          "import { titleFunction } from '../title-generators';",
          '',
          // eslint-disable-next-line no-template-curly-in-string
          "<Meta title={`${titleFunction('template')}`} />",
        ].join('\n')
      )
    ).toMatchInlineSnapshot(`
      const __page = () => {
        throw new Error('Docs-only story');
      };

      exports.__page = __page;
      __page.parameters = {
        docsOnly: true,
      };
      const componentMeta = {
        title: \`\${(0, _titleGenerators.titleFunction)('template')}\`,
        tags: ['mdx'],
        includeStories: ['__page'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('vanilla.mdx', () => {
    expect(
      clean(dedent`
        import { Button } from '@storybook/react/demo';

        # Hello MDX

        This is some random content.

        <Button>Hello button</Button>
      `)
    ).toMatchInlineSnapshot(`
      const componentMeta = {
        includeStories: [],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });

  it('errors on missing story props', async () => {
    await expect(async () =>
      clean(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" />

        # Bad story

        <Story>
          <Button>One</Button>
        </Story>
      `)
    ).rejects.toThrow('Expected a Story name, id, or story attribute');
  });

  describe('csf3', () => {
    it('auto-title-docs-only.mdx', () => {
      expect(
        clean(dedent`
          import { Meta } from '@storybook/addon-docs';

          <Meta />

          # Auto-title Docs Only

          Spme **markdown** here!
        `)
      ).toMatchInlineSnapshot(`
        const __page = () => {
          throw new Error('Docs-only story');
        };

        exports.__page = __page;
        __page.parameters = {
          docsOnly: true,
        };
        const componentMeta = {
          tags: ['mdx'],
          includeStories: ['__page'],
        };
        componentMeta.parameters = componentMeta.parameters || {};
        componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
        var _default = componentMeta;
        exports.default = _default;
      `);
    });

    it('auto-title.mdx', () => {
      expect(
        clean(dedent`
          import { Button } from '@storybook/react/demo';
          import { Story, Meta } from '@storybook/addon-docs';

          <Meta component={Button} />

          <Story name="Basic">
            <Button>Basic</Button>
          </Story>
        `)
      ).toMatchInlineSnapshot(`
        const basic = () =>
          /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, {
            children: 'Basic',
          });

        exports.basic = basic;
        basic.storyName = 'Basic';
        basic.parameters = {
          storySource: {
            source: '<Button>{"Basic"}</Button>',
          },
        };
        const componentMeta = {
          component: _demo.Button,
          tags: ['mdx'],
          includeStories: ['basic'],
        };
        componentMeta.parameters = componentMeta.parameters || {};
        componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
        var _default = componentMeta;
        exports.default = _default;
      `);
    });

    it('default-render.mdx', () => {
      expect(
        clean(dedent`
          import { Button } from '@storybook/react/demo';
          import { Story, Meta } from '@storybook/addon-docs';

          <Meta title="Button" component={Button} />

          <Story name="Basic" />
        `)
      ).toMatchInlineSnapshot(`
        const basic = {};
        exports.basic = basic;
        basic.storyName = 'Basic';
        basic.parameters = {
          storySource: {
            source: '{}',
          },
        };
        const componentMeta = {
          title: 'Button',
          component: _demo.Button,
          tags: ['mdx'],
          includeStories: ['basic'],
        };
        componentMeta.parameters = componentMeta.parameters || {};
        componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
        var _default = componentMeta;
        exports.default = _default;
      `);
    });

    it('component-render.mdx', () => {
      expect(
        clean(dedent`
          import { Button } from '@storybook/react/demo';
          import { Story, Meta } from '@storybook/addon-docs';

          <Meta title="Button" component={Button} render={(args) => <Button {...args} />} />

          <Story name="Basic" />
        `)
      ).toMatchInlineSnapshot(`
        const basic = {};
        exports.basic = basic;
        basic.storyName = 'Basic';
        basic.parameters = {
          storySource: {
            source: '{}',
          },
        };
        const componentMeta = {
          title: 'Button',
          component: _demo.Button,
          render: (args) => /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, { ...args }),
          tags: ['mdx'],
          includeStories: ['basic'],
        };
        componentMeta.parameters = componentMeta.parameters || {};
        componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
        var _default = componentMeta;
        exports.default = _default;
      `);
    });

    it('story-render.mdx', () => {
      expect(
        clean(dedent`
          import { Button } from '@storybook/react/demo';
          import { Story, Meta } from '@storybook/addon-docs';

          <Meta title="Button" component={Button} />

          <Story name="Basic" render={(args) => <Button {...args} />} />
        `)
      ).toMatchInlineSnapshot(`
        const basic = {};
        exports.basic = basic;
        basic.storyName = 'Basic';
        basic.parameters = {
          storySource: {
            source: '{}',
          },
        };

        basic.render = (args) => /*#__PURE__*/ (0, _jsxRuntime.jsx)(_demo.Button, { ...args });

        const componentMeta = {
          title: 'Button',
          component: _demo.Button,
          tags: ['mdx'],
          includeStories: ['basic'],
        };
        componentMeta.parameters = componentMeta.parameters || {};
        componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
        var _default = componentMeta;
        exports.default = _default;
      `);
    });

    it('story-play.mdx', () => {
      expect(
        clean(dedent`
          import { Button } from '@storybook/react/demo';
          import { Story, Meta } from '@storybook/addon-docs';

          <Meta title="Button" component={Button} />

          <Story name="Basic" play={() => console.log('play')} />
        `)
      ).toMatchInlineSnapshot(`
        const basic = {};
        exports.basic = basic;
        basic.storyName = 'Basic';
        basic.parameters = {
          storySource: {
            source: '{}',
          },
        };

        basic.play = () => console.log('play');

        const componentMeta = {
          title: 'Button',
          component: _demo.Button,
          tags: ['mdx'],
          includeStories: ['basic'],
        };
        componentMeta.parameters = componentMeta.parameters || {};
        componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
        var _default = componentMeta;
        exports.default = _default;
      `);
    });
  });

  it('style tag', () => {
    expect(
      clean(dedent`
        import { Meta } from '@storybook/addon-docs';

        <Meta title="Example/Introduction" />

        <style>{\`
          .subheading {
            --mediumdark: '#999999';
            font-weight: 900;
            font-size: 13px;
            color: #999;
            letter-spacing: 6px;
            line-height: 24px;
            text-transform: uppercase;
            margin-bottom: 12px;
            margin-top: 40px;
          }
          .link-list {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
            row-gap: 10px;
          }
        \`}</style>
      `)
    ).toMatchInlineSnapshot(`
      const __page = () => {
        throw new Error('Docs-only story');
      };

      exports.__page = __page;
      __page.parameters = {
        docsOnly: true,
      };
      const componentMeta = {
        title: 'Example/Introduction',
        tags: ['mdx'],
        includeStories: ['__page'],
      };
      componentMeta.parameters = componentMeta.parameters || {};
      componentMeta.parameters.docs = { ...(componentMeta.parameters.docs || {}), page: MDXContent };
      var _default = componentMeta;
      exports.default = _default;
    `);
  });
});
