/**
 * @file Temporary fudge for snowpack-plugin-optimize so that it doesn't break .ts files.
 * @author Monkatraz
*/

const optimizePlugin = require('snowpack-plugin-optimize')
module.exports = (config, opts) => {
  const plugin = optimizePlugin(config, opts)
  delete plugin.resolve
  delete plugin.load
  return plugin
}