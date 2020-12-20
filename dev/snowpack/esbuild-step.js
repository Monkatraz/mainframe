const { runBuiltInOptimize } = require('../../node_modules/snowpack/lib/build/optimize')

module.exports = (snowpackConfig, opts) => {
  return {
    name: 'esbuild-step',
    async optimize (config) {
      const fakeBuildConfig = {
        ...snowpackConfig,
        experiments: {
          optimize: {
            ...opts
          }
        }
      }
      await runBuiltInOptimize(fakeBuildConfig)
    }
  }
}