const { runBuiltInOptimize } = require('../../node_modules/snowpack/lib/build/optimize')
const fs = require('fs-extra')
const path = require('path')

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
      if (opts.bundle) {
        const webModules = snowpackConfig.buildOptions.webModulesUrl.replace(/^\//, '')
        const buildPath = snowpackConfig.buildOptions.out

        const webModulesPath = path.resolve(buildPath, webModules)
        const newWebModulesPath = path.resolve(buildPath, webModules + '_tmp')

        await fs.copy(webModulesPath, newWebModulesPath)
        await runBuiltInOptimize(fakeBuildConfig)
        await fs.copy(newWebModulesPath, webModulesPath)
        await fs.remove(newWebModulesPath)
      }
      else await runBuiltInOptimize(fakeBuildConfig)
    }
  }
}