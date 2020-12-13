/**
 * @file Inits. and exports the markdown-it renderer.
 * @author Monkatraz
 */

import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import katex from 'katex'
import type { RenderRule } from 'markdown-it/lib/renderer'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'
// init renderer
const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
}).disable('strikethrough')

/** Safely renders a given markdown string. */
export default function renderMarkdown(rawMD: string) {
  return DOMPurify.sanitize(md.render(rawMD))
}


// TODO: Consider creating a function for building a renderer as you render so that it can return custom callbacks
// TODO: Generic (block -> tag) handler
// TODO: Generic (lineSymbol -> tag) handler
// TODO: ([key]: value) handler
// TODO: use key values for variables?
//       %scp SCP-3685
//       using my %scp% var
// TODO: Custom containers implementation
// TODO: User-space components (likely its own data schema)
// TODO: Implement markdown-it-attrs or simply import it
// TODO: Wikilinks (may need to register a tippy generically to a class somehow)
//       [[rel_link|display]] [[/displayed_local_link]]
// TODO: Think about using front-matter as a page hook system when rendering
// TODO: Tags: abbr, def/deflist, u
// TODO: Components: collapsibles, figures, footnotes

// -- INIT. EXTENSIONS

addInlineSyntax({ delimiter: '^', tag: 'sup' })
addInlineSyntax({ delimiter: '~', tag: 'sub' })
addInlineSyntax({ delimiter: '~~', tag: 's' })
addInlineSyntax({ delimiter: '++', tag: 'ins' })
addInlineSyntax({ delimiter: '--', tag: 'del' })
addInlineSyntax({ delimiter: '==', tag: 'mark' })
addInlineTokenSyntax({ delimiter: '$' }, katex.renderToString)

// -- EXTENSION FUNCTIONS

interface SyntaxOpts {
  delimiter: string
  name?: string
  tag?: string
  open?: RenderRule
  close?: RenderRule
}

const UNESCAPE_RE = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g

function flanking(state: StateInline, start: number, delimiter: string) {
  const len = delimiter.length
  // last and next characters are treated as whitespace if at start/end of string
  const last = start > 0 ? state.src.charCodeAt(start - 1) : 0x20
  const next = start + len < state.posMax ? state.src.charCodeAt(start + len) : 0x20

  const isLastPunct = md.utils.isMdAsciiPunct(last) || md.utils.isPunctChar(String.fromCharCode(last))
  const isNextPunct = md.utils.isMdAsciiPunct(next) || md.utils.isPunctChar(String.fromCharCode(next))
  const isLastWhiteSpace = md.utils.isWhiteSpace(last)
  const isNextWhiteSpace = md.utils.isWhiteSpace(next)

  let left = true, right = true
  if (isNextWhiteSpace) left = false
  else if (isNextPunct) {
    if (!(isLastWhiteSpace || isLastPunct)) left = false
  }
  if (isLastWhiteSpace) right = false
  else if (isLastPunct) {
    if (!(isNextWhiteSpace || isNextPunct)) right = false
  }

  return { left, right }
}

function createMarker(delimiter: string) {
  let out = ''
  for (const char of delimiter) {
    out += '0' + char.charCodeAt(0)
  }
  return parseInt(out)
}

function numDelimiters(state: StateInline, start: number, delimiter: string) {
  const len = delimiter.length
  let count = 0
  while (state.src.substr(start + (len * count), len) === delimiter && (start + (len * count)) < state.posMax)
    count++
  return count
}

/** Utility function for adding simple ('delimiter' -> <tag></tag>) syntax to markdown-it. */
function addInlineSyntax(optsIn: SyntaxOpts) {
  // Set defaults on opts
  const opts = {
    // autogens a name from the tag if provided, if not use the delimiter
    name: optsIn?.tag ? optsIn.tag : optsIn.delimiter,
    tag: 'div',
    ...optsIn
  }
  // Some frequently reused variables
  const marker = createMarker(opts.delimiter)
  // Add our tokenizer
  md.use((md) => {
    md.inline.ruler.after('emphasis', opts.name, (state, silent) => {
      if (silent) return false
      // check if our delimiter can even fit
      const start = state.pos
      const len = opts.delimiter.length
      if (start + len > state.posMax) return false
      // check for consecutive delimiters
      const count = numDelimiters(state, start, opts.delimiter)
      if (count === 0) return false
      // get substr of all delimiters together and check flanking run on them
      const total = state.src.substr(start, len * count)
      const { left, right } = flanking(state, start, total)
      if (!left && !right) return false // neither starting nor ending so not a delimiter

      for (let i = 0; i < count; i++) {
        // push temp. text delimiter token
        state.push('text', '', 0).content = opts.delimiter
        // push to list of delimiters
        state.delimiters.push({
          marker: marker,
          length: count,
          jump: i,
          token: state.tokens.length - 1,
          end: -1,
          open: left,
          close: right
        })
      }

      // move past delimiters
      state.pos += len * count
      return true
    })
  })
  // Converts the tokens created above into open and close pairs
  const convertDelimiters = (state: StateInline, delimiters: StateInline.Delimiter[]) => {
    for (const startDelimiter of delimiters) {
      if (startDelimiter.marker !== marker) continue
      if (startDelimiter.end === -1) continue

      const endDelimiter = delimiters[startDelimiter.end]

      const startToken = state.tokens[startDelimiter.token]
      startToken.type = opts.name + '_open'
      startToken.tag = opts.tag
      startToken.nesting = 1
      startToken.markup = opts.delimiter
      startToken.content = ''

      const endToken = state.tokens[endDelimiter.token]
      endToken.type = opts.name + '_close'
      endToken.tag = opts.tag
      endToken.nesting = -1
      endToken.markup = opts.delimiter
      endToken.content = ''
    }
  }
  // Add our actual tags/tokens
  md.use((md) => {
    md.inline.ruler2.after('emphasis', opts.name, (state) => {
      convertDelimiters(state, state.delimiters)
      // Not sure what this code is actually for, but it's in the standard markdown-it plugins.
      if (state.tokens_meta) for (const token of state.tokens_meta) {
        if (token?.delimiters) convertDelimiters(state, token.delimiters)
      }
      return true
    })
  })
  // Add our open and close functions
  if (opts?.open) md.renderer.rules[opts.name + '_open'] = opts.open
  if (opts?.close) md.renderer.rules[opts.name + '_close'] = opts.close
}

function addInlineTokenSyntax(optsIn: SyntaxOpts, fn: (str: string) => string) {
  // Set defaults on opts
  const opts = {
    // autogens a name from the tag if provided, if not use the delimiter
    name: optsIn?.tag ? optsIn.tag : optsIn.delimiter,
    tag: 'div',
    ...optsIn
  }
  md.use((md) => {
    md.inline.ruler.after('emphasis', opts.name, (state, silent) => {
      if (silent) return false // skip in validation mode
      // check if our delimiter can even fit
      const start = state.pos
      const max = state.posMax
      const len = opts.delimiter.length
      if (start + len > max) return false
      // check start delimiter
      if (state.src.substr(start, len) !== opts.delimiter) return false
      // check if delimiter is not valid
      const { left, right } = flanking(state, start, opts.delimiter)
      if (!left && !right) return false
      // check end delimiter
      let pos = start + len
      while (pos < max) {
        if (state.src.substr(pos, len) === opts.delimiter) {
          const { left, right } = flanking(state, start, opts.delimiter)
          if (!left && !right) continue
          break
        }
        pos++
      }
      if (pos === max) return false

      const content = state.src.substr(start + len, pos - start - 1)

      state.push(opts.name, opts.tag, 0)
        .markup = content

      state.pos = pos + len
      return true
    })
  })
  md.renderer.rules[opts.name] = (tokens, idx) => { return fn(tokens[idx].markup) }

}