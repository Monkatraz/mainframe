/**
 * @file Build and development tool for the package.
 *
 * To use, do either:
 * - `node build.js`     | Build
 * - `node build.js dev` | Watch mode
 */

 const esbuild = require('esbuild')
 const { nodeExternalsPlugin } = require('esbuild-node-externals')

 const buildSettings = {
   entryPoints: ['./lib/index.ts'],
   outdir: 'dist',
   bundle: true,
   minify: true,
   splitting: true,
   format: 'esm',
   plugins: [nodeExternalsPlugin(/* { allowList: ['cm-tarnation'] } */)],
   logLevel: 'info'
 }

 const devSettings = {
   ...buildSettings,
   minify: false,
   sourcemap: 'inline',
   watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
    }
  }
 }

 const mode = process.argv[2].trim()

 // Build mode
 if (!mode || mode === 'build') {
   esbuild.build(buildSettings).catch(() => process.exit(1))
 }
 // Development mode
 else if (mode === 'dev') {
   esbuild.build(devSettings).then((server) => {
     process.on('beforeExit', () => server.stop())
   }).catch(() => process.exit(1))
 }
