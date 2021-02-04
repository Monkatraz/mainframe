const esbuild = require('esbuild')

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'compiler-workers',

    resolve: {
      input: ['.ts'],
      output: ['.js']
    },

    async load({ filePath = '' }) {
      if (!filePath.endsWith('-bundle-.ts')) return
      const result = await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        treeShaking: true,
        sourcemap: true,
        outdir: './',
        outbase: './',
        format: 'esm',
        write: false
      })
      const ret = { code: result.outputFiles[1].text, map: result.outputFiles[0].text }
      return { '.js': ret }
    }
  }
}
