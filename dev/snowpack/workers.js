const esbuild = require('esbuild')

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'compiler-workers',

    resolve: {
      input: ['.bundle.ts'],
      output: ['.bundle.js']
    },

    async load({ filePath = '' }) {
      const result = await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        treeShaking: true,
        // sourcemap: true,
        outdir: './',
        outbase: './',
        format: 'esm',
        write: false
      })
      const ret = { code: result.outputFiles[0].text }
      return { '.bundle.js': ret }
    }
  }
}
