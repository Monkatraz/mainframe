import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
// init renderer
const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

/** Safely renders a given markdown string. */
export default function renderMarkdown(rawMD: string) {
  return DOMPurify.sanitize(md.render(rawMD))
}

// -- EXTENSION FUNCTIONS

const UNESCAPE_RE = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g

/** Utility function for adding simple ('delimiter' -> <tag></tag>) syntax to markdown-it.
 *  @example addInlineSyntax('superscript', '^', 'sup')
 */
function addInlineSyntax(type: string, delimiter: string, tag: string) {
  // Convert our delimiter into a character code as that is what markdown-it expects
  // TODO: make this handle multi-character inputs
  const char = delimiter.charCodeAt(0)
  // Extend renderer
  md.use((md) => {
    // Add our syntax after the `emphasis` token like most inline syntax plugins
    // TODO: switch this to the more complex delimiter API
    md.inline.ruler.after('emphasis', type, (state, silent) => {
      if (silent) return false // skip in validation mode

      const max = state.posMax
      const start = state.pos
      if (start + 2 >= max) return false // don't parse beyond EOS

      // Check start char
      if (state.src.charCodeAt(start) !== char) return false // check start character
      state.pos = start + 1
      console.log(state)

      // Check end char
      let endCharFound = false
      while (state.pos < max && !endCharFound) {
        if (state.src.charCodeAt(state.pos) === char) endCharFound = true
        else state.md.inline.skipToken(state) // Loop to next token
      }
      // Exhausted string or end char was never found
      if (!endCharFound || start + 1 === state.pos) {
        state.pos = start
        return false
      }

      // Get inner content of our inline block
      const content = state.src.slice(start + 1, state.pos)
      // Return if unescaped spaces/newlines are inside
      if (content.match(/(^|[^\\])(\\\\)*\s/)) {
        state.pos = start
        return false
      }

      // Matched!
      state.posMax = state.pos
      state.pos = start + 1

      // Shove in all of our tokens
      state.push(type + '_open', tag, 1)
        .markup = delimiter
      state.push('text', '', 0)
        .content = content.replace(UNESCAPE_RE, '$1')
      state.push(type + '_close', tag, -1)
        .markup = delimiter

      state.pos = state.posMax + 1
      state.posMax = max
      return true
    })
  })
}

// TODO: const util = fnRegister(state) | attaches utility functions to state
// TODO: util functions: util.lookahead (2, ['a', 'b'])
// TODO: Consider creating a function for building a renderer as you render so that it can return custom callbacks
// TODO: Generic (block -> tag) handler
// TODO: ([key]: value) handler
// TODO: use key values for variables?
// TODO: Custom containers implementation
// TODO: User-space components (likely its own data schema)
// TODO: Implement markdown-it-attrs or simply import it
// TODO: Footnotes implementation
// TODO: Wikilinks (may need to register a tippy generically to a class somehow)
//       [[rel_link|display]] [[/displayed_local_link]]
// TODO: Think about using front-matter as a page hook system when rendering
// TODO: Tags: abbr, def/deflist, mark, ins, del, u
// TODO: Components: collapsibles, figures

// -- INIT. EXTENSIONS

// Inline Syntaxes
// '~~' -> '<s>` (added by default)
addInlineSyntax('sup', '^', 'sup') // '^' -> '<sup>'
addInlineSyntax('sub', '~', 'sub') // '~' -> '<sub>'