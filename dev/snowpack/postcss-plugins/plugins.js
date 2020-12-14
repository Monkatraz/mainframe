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
  require('postcss-discard-duplicates')(),
  require('./discardoverriddenprops')(),
  require('autoprefixer')()
]

// And now we turn them back on
console.warn = oldWarn

module.exports = postcssPlugins