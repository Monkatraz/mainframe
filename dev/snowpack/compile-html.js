const fs = require('fs').promises
const pug = require('pug')

// Renderer
function renderPug (src = '', opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      resolve(pug.render(src, opts))
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'compile-html',
    resolve: {
      input: ['.pug'],
      output: ['.html']
    },
    async load ({ filePath }) {
      // Don't load partials
      if (/\\_.*\.pug$/.test(filePath)) return {}

      try {
        // Get our file
        const src = String(await fs.readFile(filePath))

        // Compile Pug
        const result = await renderPug(src, {
          filename: filePath
        })

        return { '.html': result }
      } catch (err) {
        console.error(err)
        if (err.message) console.error(err.message)
        return {}
      }
    }
  }
}
