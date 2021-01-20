module.exports = {
  mount: {
    src: '/',
    public: {
      url: '/',
      static: true,
      resolve: false
    }
  },
  packageOptions: {
    polyfillNode: false,
    packageLookupFields: [ 'svelte' ],
    rollup: {
      dedupe: [
        '@codemirror/autocomplete',
        '@codemirror/closebrackets',
        '@codemirror/commands',
        '@codemirror/comment',
        '@codemirror/fold',
        '@codemirror/gutter',
        '@codemirror/highlight',
        '@codemirror/history',
        '@codemirror/language',
        '@codemirror/language-data',
        '@codemirror/matchbrackets',
        '@codemirror/rectangular-selection',
        '@codemirror/search',
        '@codemirror/state',
        '@codemirror/view',
        'lezer',
        'lezer-tree'
      ],
      plugins: [ require('rollup-plugin-node-polyfills')() ]
    }
  },
  devOptions: {
    open: 'none',
    output: 'stream'
  },
  buildOptions: {
    out: 'build',
    clean: true,
    metaUrlPath: 'static/snowpack',
    sourcemap: true
  },
  alias: {
    '@vendor': './public/vendor',
    '@data': './src/static/data',
    '@schemas': './src/static/data/schemas.d.ts',
  },
  routes: [ { src: '.*', dest: '/index.html', match: 'routes' } ],
  optimize: {
    preload: true,
    minify: true,
    treeshake: true,
    splitting: true,
    manifest: true,
    target: 'es2020'
  },
  plugins: [
    ['@snowpack/plugin-build-script', { cmd: 'js-yaml', input: ['.yaml'], output: ['.json'] }],
    '@snowpack/plugin-svelte',
    './dev/snowpack/compile-css.js',
    './dev/snowpack/workers.js'
  ]
}