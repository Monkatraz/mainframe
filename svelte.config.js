// Plugins
const sveltePreprocess = require('svelte-preprocess');

// This silences PostCSS depecrated plugin warnings
const oldWarn = console.warn
console.warn = () => { }

const postcssPluginsPath = './dev/snowpack/postcss-plugins/'
const postcssPlugins = [
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

module.exports = {
  // @ts-ignore
  preprocess: sveltePreprocess({
    postcss: {
      plugins: postcssPlugins
    },
    stylus: { paths: ['./src/static/css/', './dev/snowpack/stylus-plugins/'] }
  }),
  compilerOptions: {
    // Due to Svelte components not being bundled, it's more effective to inline the CSS here.
    // TODO: Find a way to bundle Svelte CSS
    css: true
  }
};