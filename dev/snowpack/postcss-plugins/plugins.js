// This silences PostCSS depecrated plugin warnings
const oldWarn = console.warn
console.warn = () => { }

const postcssPlugins = [
  require('postcss-center')(),
  require('postcss-easing-gradients')(),
  require('./optimizenestedids')(),
  require('css-mquery-packer')({
    sort: require('sort-css-media-queries').desktopFirst
  }),
  require('postcss-combine-duplicated-selectors')(),
  require('postcss-join-transitions')(),
  require('postcss-discard-duplicates')(),
  require('./discardoverriddenprops')(),
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

module.exports = postcssPlugins