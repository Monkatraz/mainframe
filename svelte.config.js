const sveltePreprocess = require('svelte-preprocess');

module.exports = {
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
    css: true
  }
};