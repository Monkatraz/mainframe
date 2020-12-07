// Plugins
const sveltePreprocess = require('svelte-preprocess');

module.exports = {
  // @ts-ignore
  preprocess: sveltePreprocess({
    postcss: {
      plugins: require('./dev/snowpack/postcss-plugins/plugins')
    },
    stylus: { paths: ['./src/static/css/', './dev/snowpack/stylus-plugins/'] }
  }),
  compilerOptions: {
    // Due to Svelte components not being bundled, it's more effective to inline the CSS here.
    css: false
  }
};