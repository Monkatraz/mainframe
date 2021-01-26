const esbuild = require('esbuild')

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'compiler-workers',
    resolve: {
      input: ['.worker.ts'],
      output: ['.js']
    },
    config(config) {
      // hacks!!! basically just putting our plugin at the start
      const plugin = config.plugins.pop()
      config.plugins.unshift(plugin)
    },

    async load({ filePath = '' }) {
      const result = await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        treeShaking: true,
        sourcemap: true,
        outdir: './',
        outbase: './',
        write: false
      })
      return { '.js': { code: result.outputFiles[1].text, map: result.outputFiles[0].text } }
    }
  }
}
