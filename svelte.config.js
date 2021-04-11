const sveltePreprocess = require('svelte-preprocess')

module.exports = {
  preprocess: sveltePreprocess({
    postcss: require('./postcss.config'),
    stylus: {
      paths: ['./src/static/css/', './dev/snowpack/stylus-plugins/'],
      sourcemap: true
    }
  }),
  compilerOptions: {
    css: true,
    immutable: true
  }
}
