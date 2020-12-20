/**
 * @file Bundles the workers that Mainframe uses.
 * @author Monkatraz
*/

const fs = require('fs').promises
const esbuild = require('esbuild')

module.exports = function (config, pluginOptions) {
  return {
    name: 'bundle-workers',
    optimize: async (opts) => {
      console.info('[bundle-workers] Bundling workers...')
      const output = (await esbuild.build({
        entryPoints: ['./build/static/js/workers/md-renderer.js'],
        bundle: true,
        write: false
      })).outputFiles[0].contents
      await fs.writeFile('./build/static/js/workers/md-renderer.js', output)
      console.info('[bundle-workers] Worker bundling complete.')
    }
  }
}