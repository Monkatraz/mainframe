const fs = require('fs').promises
const path = require('path')
const postcss = require('postcss')
const stylus = require('stylus')

// This silences PostCSS depecrated plugin warnings
const oldWarn = console.warn
console.warn = () => { }

const postcssPluginsPath = './postcss-plugins/'
const postcssPlugins = [
  require('postcss-normalize')(),
  require('postcss-center')(),
  require('postcss-easing-gradients')(),
  require(postcssPluginsPath + 'optimizenestedids')(),
  require('css-mquery-packer')({
    sort: require('sort-css-media-queries').desktopFirst
  }),
  require('postcss-combine-duplicated-selectors')(),
  require('postcss-join-transitions')(),
  require('postcss-discard-duplicates')(),
  require(postcssPluginsPath + 'discardoverriddenprops')(),
  require('autoprefixer')(),
  require('cssnano')({
    preset: [
      'advanced',
      {
        normalizeWhitespace: false, // Makes reading output 10x easier
        autoprefixer: false, // Wouldn't change anything
        discardUnused: false, // Breaks fonts
        mergeRules: false // Already done previously but also causes issues if left on
      }
    ]
  })
]

// And now we turn them back on
console.warn = oldWarn

// @ts-ignore
const postcssRenderer = postcss(postcssPlugins)

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
        basePath: '/../src/static/css/'
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
        this.markChanged(path.normalize(path.normalize(path.dirname(filePath) + '/../main.styl')))
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
          map: {
            inline: false,
            annotation: false
          }
        })

        return { '.css': result.css }
      } catch (err) {
        console.error(err)
        if (err.message) console.error(err.message)
        return {}
      }
    }
  }
}
