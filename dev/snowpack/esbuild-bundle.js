const { runBuiltInOptimize } = require('../../node_modules/snowpack/lib/build/optimize')
const fs = require('fs-extra')
const path = require('path')

module.exports = (snowpackConfig, opts) => {
  return {
    name: 'esbuild-bundle',
    async optimize () {
      // use our hack and bundle every 'bundle' file
      if (opts.bundle) for (const file of opts.bundle) {
        const fakeBuildConfig = {
          ...snowpackConfig,
          experiments: {
            optimize: {
              entrypoints: [file],
              bundle: true
            }
          }
        }

        const buildPath = path.resolve(snowpackConfig.buildOptions.out)
        const filePath = path.resolve(buildPath, file)
        const buildPathTemp = path.resolve('../../node_modules/.cache/esbuild_tmp_build/')
        const filePathTemp = path.resolve(buildPathTemp, file)

        await fs.copy(buildPath, buildPathTemp)
        await runBuiltInOptimize(fakeBuildConfig)
        await fs.copy(filePath, filePathTemp)
        await fs.remove(buildPath)
        await fs.rename(buildPathTemp, buildPath)
      }
      // properly run the optimizer
      if (opts.minify || opts.preload) {
        const fakeBuildConfig = {
          ...snowpackConfig,
          experiments: {
            optimize: {
              entrypoints: 'auto',
              ...opts,
              bundle: false
            }
          }
        }
        await runBuiltInOptimize(fakeBuildConfig)
      }
    }
  }
}