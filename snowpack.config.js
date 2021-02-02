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
      plugins: [ require('rollup-plugin-node-polyfills')() ]
    }
  },
  devOptions: {
    open: 'none',
    output: 'stream',
    hmr: false
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
    '@components': './src/static/lib/components/index.ts',
    '@schemas': './src/static/data/schemas.d.ts'
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
