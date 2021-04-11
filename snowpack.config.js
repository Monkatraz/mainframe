// const esbuildSettings = '--outbase=./packages/cm6 --outdir=./packages/cm6/dist --format=esm'

module.exports = {
  workspaceRoot: './packages',
  mount: {
    src: '/',
    public: {
      url: '/',
      static: true,
      resolve: false
    }
  },
  packageOptions: {
    knownEntrypoints: [
      './packages/cm6',
      './packages/tarnation'
    ],
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
    '@schemas':      './src/static/data/schemas.d.ts'
  },
  routes: [ { src: '.*', dest: '/index.html', match: 'routes' } ],
  optimize: {
    minify: true,
    treeshake: true,
    splitting: true,
    sourcemap: 'external',
    manifest: true,
    target: 'es2020'
  },
  plugins: [
    ['@snowpack/plugin-build-script', { cmd: 'js-yaml', input: ['.yaml'], output: ['.json'] }],
    ['@snowpack/plugin-run-script', {
      name: 'CM6',
      cmd: '(cd packages/cm6 && npm run build)',
      watch: '(cd packages/cm6 && npm run dev)'
    }],
    ['@snowpack/plugin-run-script', {
      name: 'Tarnation',
      cmd: '(cd packages/tarnation && npm run build)',
      watch: '(cd packages/tarnation && npm run dev)'
    }],
    '@snowpack/plugin-svelte',
    ['snowpack-plugin-stylus', {
      paths: ['./src/static/css/', './dev/snowpack/stylus-plugins/']
    }],
    '@snowpack/plugin-postcss',
    './dev/snowpack/workers.js'
  ]
}
