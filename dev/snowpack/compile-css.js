const fs = require('fs').promises
const path = require('path')
const postcss = require('postcss')
const stylus = require('stylus')

// Renderers
const stylusPaths = ['./src/static/css/', './dev/snowpack/stylus-plugins/']
const stylusRender = function (str = '', filePath = '') {
  return new Promise((resolve, reject) => {
    const renderer = stylus(str)
      .set('filename', filePath)
      .set('paths', stylusPaths)
      .set('sourcemap', {
        comment: false,
        inline: true,
        basePath: './src/static/css/'
      })
    renderer.render((err, css) => {
      if (err) reject(err)
      // @ts-ignore
      resolve([css, renderer.sourcemap])
    })
  })
}

// @ts-ignore
const postcssRenderer = postcss([require('postcss-normalize'), ...require('./postcss-plugins/plugins')])
const postCSSRender = function (str = '', options = {}) {
  return new Promise((resolve, reject) => {
    postcssRenderer
      .process(str, options)
      .then(resolve)
      .catch((err) => {
        reject(err)
      })
  })
}

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'compile-css',
    resolve: {
      input: ['.styl'],
      output: ['.css']
    },
    onChange ({ filePath }) {
      // Reload the main CSS if we change a partial
      if (/\\_.*\.styl$/.test(filePath)) {
        this.markChanged(path.normalize(path.dirname(filePath) + '/../main.styl'))
      }
    },
    async load ({ filePath = '' }) {
      // Don't load partials
      if (/\\_.*\.styl$/.test(filePath)) return {}

      // Get our file
      const src = await fs.readFile(filePath, { encoding: 'utf-8' })

      // Compile Stylus
      const [outStylus, stylusMap] = await stylusRender(src, filePath)

      // Compile PostCSS
      const outputName = filePath.replace(/\.styl$/, '.css')
      const result = await postCSSRender(outStylus, {
        from: outputName,
        to: outputName,
        map: {
          inline: false,
          annotation: false,
          prev: stylusMap,
          sourcesContent: true
        }
      })

      return { '.css': { code: result.css, map: result.map } }
      // return { '.css': { code: outStylus, map: stylusMap } }
    }
  }
}
