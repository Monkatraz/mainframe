const parse = require('./parse')
const getAlignContent = require('./align-content')
const getJustifyContent = require('./justify-content')
const getAlignSelf = require('./align-self')
const getJustifySelf = require('./justify-self')
const getGridRows = require('./grid-template-rows')
const getGridCols = require('./grid-template-columns')
const getGridAreas = require('./grid-template-areas')

const DEFAULTS_OPTIONS = {}
const OPTIONS = {
  dimensionParser: (dimension) => {
    // v(my-cool-length) → var(--my-cool-length)
    const CUSTOM_VAR_SYNTAX = /v\((.*)\)/
    const varMatch = dimension.match(CUSTOM_VAR_SYNTAX)
    if (varMatch != null) return `var(--${varMatch[1]})`

    // vm(auto, my-cool-length) → minmax(auto, var(--my-cool-length))
    const CUSTOM_MINMAXVAR_SYNTAX = /vm\((.*),(?:\s*)(.*)\)/
    const varMinmaxMatch = dimension.match(CUSTOM_MINMAXVAR_SYNTAX)
    if (varMinmaxMatch != null) {
      return `minmax(${varMinmaxMatch[1]},var(--${varMinmaxMatch[2]}))`
    }

    const CUSTOM_ESCAPED_SYNTAX = /^\((.*)\)$/
    const escapedMatch = dimension.match(CUSTOM_ESCAPED_SYNTAX)
    if (escapedMatch != null) return escapedMatch[1]

    const CUSTOM_STATIC_SYNTAX = /(\$.*)/
    const staticMatch = dimension.match(CUSTOM_STATIC_SYNTAX)
    if (staticMatch != null) return staticMatch[1]
    return null
  }
}

var Nodes = require('stylus').nodes

module.exports = function () {
  return function (style) {
    style.define('grid-kiss-list', function (...gridStrings) {
      // PostCSS variable conversion weirdness
      const gridString = gridStrings.map((str) => `"${str.string}"`).join('\n')
      const options = Object.assign({}, DEFAULTS_OPTIONS, OPTIONS)
      const decl = { value: gridString }

      // Stylus Return Arrays
      const gridProps = []
      const zonesList = []

      const { rows, cols, zones, rowIndexes, colIndexes } = parse(decl, options)
      const rowDims = getGridRows({ rows, colIndexes, rowIndexes, options })
      const colDims = getGridCols({
        decl,
        rows,
        zones,
        colIndexes,
        rowIndexes,
        options
      })

      const _pushProp = (val) => {
        const push = !val ? false : new Nodes.Ident(val, null)
        gridProps.push(push)
      }
      _pushProp(getAlignContent({ rows }))
      _pushProp(getJustifyContent({ cols }))
      gridProps.push(
        rowDims ? rowDims.map((str) => new Nodes.Ident(str, null)) : false
      )
      gridProps.push(
        colDims ? colDims.map((str) => new Nodes.Ident(str, null)) : false
      )
      _pushProp(getGridAreas({ zones, rowIndexes, colIndexes }))

      // zone declarations
      zones
        .filter((zone) => zone.selector)
        .forEach((zone, i, zonesWithSelector) => {
          const name = zone.name
          const combinator = zone.selector.startsWith('#') ? '' : '> '
          const rule = `${combinator}${zone.selector}`.trim()
          const zoneProps = []

          const _pushProp = (val) => {
            const push = !val ? false : new Nodes.Ident(val, null)
            zoneProps.push(push)
          }
          _pushProp(name)
          _pushProp(getJustifySelf(zone))
          _pushProp(getAlignSelf(zone))

          if (zoneProps.length !== 0) {
            zonesList.push([rule, ...zoneProps])
          }
        })

      return [gridProps, zonesList]
    })
  }
}
