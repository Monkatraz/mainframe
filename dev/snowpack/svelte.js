const esbuild = require('esbuild')
const sveltePlugin = require('esbuild-svelte')
const sveltePreprocess = require('svelte-preprocess')

const options = { preprocessor: sveltePreprocess({
    postcss: {
      plugins: require('./postcss-plugins/plugins')
    },
    stylus: {
      paths: ['./src/static/css/', './dev/snowpack/stylus-plugins/'],
      sourcemap: true
    }
  }),
  compileOptions: {
    css: true
  }
}

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'compile-svelte',
    resolve: {
      input: ['.svelte'],
      output: ['.js']
    },
    knownEntrypoints: [
      'svelte/internal'
    ],
    async load ({ filePath = '' }) {
      const result = await esbuild.build({
        entryPoints: [filePath],
        treeShaking: true,
        sourcemap: true,
        plugins: [sveltePlugin(options)],
        outdir: './',
        outbase: './',
        write: false
      })
      return { '.js': { code: result.outputFiles[1].text, map: result.outputFiles[0].text } }
    }
  }
}