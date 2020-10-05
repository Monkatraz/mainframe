const fs = require('fs').promises
const postcss = require('postcss')
const stylus = require('stylus')

// This silences PostCSS depecrated plugin warnings
const oldWarn = console.warn
console.warn = () => {  }

const postcssPluginsPath = './postcss-plugins/'
const postcssPlugins = [
  require('postcss-normalize')(),
  require('postcss-easing-gradients')(),
  require(postcssPluginsPath + 'optimizenestedids')(),
  require('css-mquery-packer')({
    sort: require('sort-css-media-queries').desktopFirst
  }),
  require('postcss-combine-duplicated-selectors')(),
  require('postcss-join-transitions')(),
  require('postcss-gradient-transparency-fix')(),
  require('postcss-discard-duplicates')(),
  require(postcssPluginsPath + 'discardoverriddenprops')(),
  require('autoprefixer')(),
  require('cssnano')({
    preset: [
      'advanced',
      {
        normalizeWhitespace: false, // Makes reading output 10x easier
        autoprefixer: false, // Wouldn't change anything
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
    async load ({ filePath = '' }) {
      // Don't load partials
      if (/\\_.*\.styl$/.test(filePath)) return { '.css': false }

      try {
        // Get our file
        const src = String(await fs.readFile(filePath))

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
        // TODO: Figure out how to get PostCSS sourcemaps to work here
        return { '.css': result.css }
      } catch (err) {
        console.error(err)
        if (err.message) console.error(err.message)
        return { '.css': false }
      }
    }
  }
}