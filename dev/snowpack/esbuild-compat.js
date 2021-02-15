module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'esbuild-compat',

    config(snowpackConfig) {
      snowpackConfig.exclude.shift()
    }
  }
}
