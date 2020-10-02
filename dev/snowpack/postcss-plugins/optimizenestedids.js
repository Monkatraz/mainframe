const postcss = require('postcss')
module.exports = postcss.plugin('postcss-optimize-nested-ids', () => {
  return (root) => {
    root.walkRules((rule) => {
      const selectors = rule.selectors
      const validSelectors = []
      const invalidSelectors = []
      let doOptimize = false
      selectors.forEach((selector) => {
        // Selector has no IDs or less than 2 IDs so we'll skip this one
        if (/(?:.*#){2,}/.test(selector) === false) {
          validSelectors.push(selector)
          return
        }

        // This gets everything EXCEPT everything past the last ID.
        // We need to only check the IDs before the last ID in the selector.
        const match = /.+(?<!.(?!#))/.exec(selector)
        let precedingSelector = match !== null ? match[0] : null
        // No idea how this could happen but it's just a failsafe
        if (precedingSelector === null) {
          validSelectors.push(selector)
          return
        }
        // We'll do some cleanup on this string to simplify things
        // Replace > with a space, as this is basically the same thing for what we care about
        // And then clean up any sequence of spaces longer than 1 space (so that splits don't have a fit)
        precedingSelector = precedingSelector
          .trim()
          .replace('>', ' ')
          .replace(/\s{2,}/, ' ')

        // This checks that our preceding selector only has direct/descendent child combinators
        // Selectors with anything else signifiy something that cannot be optimized
        if (/\[|:|\.|\+|~|@/.test(precedingSelector)) {
          validSelectors.push(selector)
          return
        }

        // This checks that our preceding selector only has IDs for each element
        let isInvalid = true
        precedingSelector.split(/\s/).forEach((element) => {
          if (element.startsWith('#') === false) isInvalid = false
        })
        if (!isInvalid) {
          validSelectors.push(selector)
          return
        }

        // We made it past our checks, so we can feel pretty safe optimizing this selector
        invalidSelectors.push(selector)
        doOptimize = true
      })

      if (doOptimize) {
        // Edit our invalid selectors (by taking the last ID) and add them to the valid selectors array
        invalidSelectors.forEach((selector) => {
          const ids = selector.split('#') // Lazy but whatever lol
          validSelectors.push('#' + ids[ids.length - 1])
        })
        // Join them and we're done!
        const selector = validSelectors.join(',')
        rule.selector = selector
      }
    })
  }
})
