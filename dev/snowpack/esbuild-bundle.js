const { runBuiltInOptimize } = require('../../node_modules/snowpack/lib/build/optimize')
const fs = require('fs-extra')
const path = require('path')

module.exports = (snowpackConfig, opts) => {
  return {
    name: 'esbuild-bundle',
    async optimize () {
      // use our hack and bundle every 'bundle' file
      if (opts.bundle) {
        const buildPath = path.resolve(snowpackConfig.buildOptions.out)
        const buildPathRef = path.resolve('../../node_modules/.cache/esbuild_ref_build/')
        const buildPathTemp = path.resolve('../../node_modules/.cache/esbuild_tmp_build/')
        await fs.copy(buildPath, buildPathRef)
        for (const file of opts.bundle) {
          const fakeBuildConfig = {
            ...snowpackConfig,
            experiments: {
              optimize: {
                entrypoints: [file],
                bundle: true
              }
            }
          }

          const filePath = path.resolve(buildPath, file)
          const filePathTemp = path.resolve(buildPathTemp, file)

          await runBuiltInOptimize(fakeBuildConfig)
          await fs.copy(filePath, filePathTemp)
          await fs.copy(buildPathRef, buildPath)
        }
        await fs.copy(buildPathRef, buildPath)
        await fs.copy(buildPathTemp, buildPath)
        await fs.remove(buildPathRef)
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