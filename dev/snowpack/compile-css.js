const fs = require('fs').promises
const path = require('path')
const postcss = require('postcss')
const stylus = require('stylus')

// @ts-ignore
const postcssRenderer = postcss([require('postcss-normalize'), ...require('./postcss-plugins/plugins')])

const stylusPaths = ['./src/static/css/', './dev/snowpack/stylus-plugins/']

// Renderers
const stylusRender = function (str = '', path = '') {
  return new Promise((resolve, reject) => {
    stylus(str)
      .set('filename', path)
      .set('paths', stylusPaths)
      .set('sourcemap', {
        comment: false,
        inline: true,
        basePath: 'src/static/css'
      })
      .render((err, css) => {
        if (err) reject(err)
        resolve(css)
      })
  })
}
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

      try {
        // Get our file
        const src = await fs.readFile(filePath, { encoding: 'utf-8' })

        // Compile Stylus
        const outStylus = await stylusRender(src, filePath)

        // Compile PostCSS
        const result = await postCSSRender(outStylus, {
          from: filePath,
          to: filePath,
          map: {
            inline: false,
            annotation: false,
            from: ''
          }
        })

        return { '.css': { code: result.css, map: result.map } }
      } catch (err) {
        console.error(err)
        if (err.message) console.error(err.message)
        return {}
      }
    }
  }
}
