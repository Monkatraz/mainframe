const esbuildSettings = '--outbase=./packages/cm6 --outdir=./packages/cm6/dist --bundle --format=esm'

module.exports = {
  exclude: ['./node-modules', '**/*.d.ts'],
  mount: {
    'src': '/',
    'public': {
      url: '/',
      static: true,
      resolve: false
    },
    'packages/cm6/dist': {
      url: '/static/packages/cm6',
      static: true
    }
  },
  packageOptions: {
    polyfillNode: true,
    packageLookupFields: [ 'svelte' ]
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
    '@vendor':       './public/vendor',
    '@data':         './src/static/data',
    '@components':   './src/static/lib/components/index.ts',
    '@schemas':      './src/static/data/schemas.d.ts',
    'cm6-mainframe': './packages/cm6/dist/lib/index.js'
  },
  routes: [ { src: '.*', dest: '/index.html', match: 'routes' } ],
  optimize: {
    preload: true,
    minify: true,
    treeshake: true,
    splitting: false,
    manifest: true,
    target: 'es2020'
  },
  plugins: [
    ['@snowpack/plugin-build-script', { cmd: 'js-yaml', input: ['.yaml'], output: ['.json'] }],
    ['@snowpack/plugin-run-script', {
      name: 'CM6',
      cmd: '(cd packages/cm6 && npm run build)',
      watch: `esbuild ./packages/cm6/lib/index.ts --watch ${esbuildSettings}`
    }],
    '@snowpack/plugin-svelte',
    './dev/snowpack/compile-css.js',
    './dev/snowpack/workers.js'
  ]
}
