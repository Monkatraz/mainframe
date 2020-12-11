// Plugins
const sveltePreprocess = require('svelte-preprocess');

module.exports = {
  // @ts-ignore
  preprocess: sveltePreprocess({
    postcss: {
      plugins: require('./dev/snowpack/postcss-plugins/plugins')
    },
    stylus: {
      paths: ['./src/static/css/', './dev/snowpack/stylus-plugins/'],
      sourcemap: true
    }
  }),
  compilerOptions: {
    css: false
  }
};