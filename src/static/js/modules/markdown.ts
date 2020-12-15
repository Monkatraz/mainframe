/**
 * @file Exports the Markdown rendering library for Mainframe.
 * @author Monkatraz
 */
// Imports
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import katex from 'katex'
import "@vendor/prism.js"
export const Prism = window.Prism
Prism.manual = true
// Divert languages to CDN instead of storing them ourselves
Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.21.0/components/'
// Used for md-it extensions
import type { RenderRule } from 'markdown-it/lib/renderer'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'

// TODO: Generic (block -> tag) handler
// TODO: Generic (lineSymbol -> tag) handler
// TODO: Components: collapsibles, figures, footnotes
// ? expose render internals through callback
// ? front-matter as a page hook system when rendering
// ? Markdown Svelte component that can handle async post-processing

// TODO: Tags: abbr, def/deflist, u (errors), b?
// simple mappings:
// ^  -> <sup>
// ~  -> <sub>
// ~~ -> <s>
// ++ -> <ins>
// -- -> <del>
// == -> <mark>
// /  -> <i>

// ? set font

// ? [DATA EXPUNGED] auto detect

// ? details -> summary collapsible

// ? <style> tags

// wikilinks
// [[Link]](relative.page) | [[Link]](/static.page)
// could potentially just convert links into wikilinks automatically

// vars | preserves ![] and [] link syntax assc.
// [title]: my title
// to use: @[title] <- (inserts the var)

// cmp -> <tag> or cmp() fn.
// [:cmp attrs: inline component]
// :::cmp attrs
//  block
// :::

// ? user-made components
// can likely use @[] vars for this
// editor may be able to auto-suggest (with a hover or something) parameters
// requires component signature and schema

// math | uses Katex
// $tex-expression$

// -- INIT. EXTENSIONS

const newSyntax = [
  inlineSyntax({ delimiter: '^', tag: 'sup' }),
  inlineSyntax({ delimiter: '~', tag: 'sub' }),
  inlineSyntax({ delimiter: '~~', tag: 's' }),
  inlineSyntax({ delimiter: '++', tag: 'ins' }),
  inlineSyntax({ delimiter: '--', tag: 'del' }),
  inlineSyntax({ delimiter: '==', tag: 'mark' }),
  inlineSyntax({ delimiter: '/', tag: 'i' }),
  inlineSyntax({ delimiter: ['[', ']'], tag: 'span', after: 'image' }),
  inlineSyntax({
    delimiter: '$', strict: true,
    render: (str) => katex.renderToString(str, {
      throwOnError: false
    })
  })
]

export function generateRenderer() {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
  // We disable strikethrough as we use our better parser for it.
  md.disable('strikethrough')
  // Adds all of our syntax at once.
  newSyntax.map(md.use, md)
  // This bit of code replaces the original text token with a slightly less efficient one.
  // However, this function allows you to extend what is considered a terminator character to the parser.
  // The source of this function actually comes from markdown-it, it's just commented out.
  // New Terminators: '/'
  const TERMINATOR_RE = /[\n!#$%&*+\-:<=>@[\\\]^_`{}~/]/
  md.inline.ruler.at('text', (state, silent) => {
    const pos = state.pos
    const idx = state.src.slice(pos).search(TERMINATOR_RE)
    // first char is terminator -> empty text
    if (idx === 0) return false
    // no terminator -> text till end of string
    if (idx < 0) {
      if (!silent) state.pending += state.src.slice(pos)
      state.pos = state.src.length
      return true
    }
    if (!silent) state.pending += state.src.slice(pos, pos + idx)
    state.pos += idx
    return true
  })
  return (raw: string) => DOMPurify.sanitize(md.render(raw))
}

// -- EXTENSION FUNCTIONS

interface InlineSyntaxOpts {
  delimiter: string | [string, string]
  strict?: boolean
  tag?: string
  name?: string
  after?: string
  render?: (str: string) => string
  open?: RenderRule
  close?: RenderRule
}

// Yes, parsers are extremely messy and this is a catch-all function.
// But you can't argue with the results: it's stupid easy to add new syntax.
function inlineSyntax(optsIn: InlineSyntaxOpts) {
  const name =
    optsIn.tag ? optsIn.tag :
      typeof optsIn.delimiter === 'string' ? optsIn.delimiter :
        optsIn.delimiter[0] + optsIn.delimiter[1]
  const opts = { name, strict: false, tag: 'div', after: 'emphasis', ...optsIn }

  // TODO: more cleanup and commenting
  const useSingleToken = opts.render !== undefined
  return (md: MarkdownIt) => {
    if (opts.delimiter instanceof Array) {
      // Bracketed delimiters
      md.inline.ruler.after(opts.after, opts.name, (state, silent) => {
        if (silent) return false
        const start = state.pos
        const max = state.posMax
        const [pairLeft, pairRight] = opts.delimiter as [string, string]
        const lenLeft = pairLeft.length
        const lenRight = pairRight.length
        // check start delimiter
        if (start + lenLeft > max) return false
        if (state.src.substr(start, lenLeft) !== pairLeft) return false
        // check end delimiter
        let pos = start + lenLeft
        let level = 1
        // TODO: functionalize this with delimiter / pair mode
        while (pos < max) {
          if (state.src.substr(pos, lenLeft) === pairLeft) level++
          else if (state.src.substr(pos, lenRight) === pairRight) level--
          if (level === 0) break
          pos++
        }
        if (pos === max) return false
        // matched!
        if (useSingleToken) state.push(opts.name, opts.tag, 0)
          .markup = state.src.substr(start + lenLeft, pos - start - 1)
        else {
          state.push(opts.name + '_open', opts.tag, 1)
            .markup = pairLeft
          inlineTokenize(state, start + lenLeft, pos)
          state.push(opts.name + '_close', opts.tag, -1)
        }
        state.pos += lenRight
        return true
      })
    } else if (typeof opts.delimiter === 'string') {
      // Non-bracketed delimiters
      let out = ''
      for (const char of opts.delimiter) out += '0' + char.charCodeAt(0)
      const marker = parseInt(out)
      md.inline.ruler.after(opts.after, opts.name, (state, silent) => {
        if (silent) return false
        const start = state.pos
        const max = state.posMax
        const len = opts.delimiter.length
        if (start + len > max) return false

        if (useSingleToken) {
          // check start delimiter
          if (state.src.substr(start, len) !== opts.delimiter) return false
          // check if delimiter is not valid
          const { left, right } = flanking(state, start, opts.delimiter, opts.strict)
          if (!left && !right) return false
          // check end delimiter
          let pos = start + len
          while (pos < max) {
            if (state.src.substr(pos, len) === opts.delimiter) {
              const { left, right } = flanking(state, start, opts.delimiter, opts.strict)
              if (!left && !right) continue
              break
            }
            pos++
          }
          if (pos === max) return false
          // matched!
          state.push(opts.name, opts.tag, 0)
            .markup = state.src.substr(start + len, pos - start - 1)
          state.pos = pos + len
          return true

        } else {
          // check for consecutive delimiters
          const count = numDelimiters(state, start, opts.delimiter as string)
          if (count === 0) return false
          // get substr of all delimiters together and check flanking run on them
          const total = state.src.substr(start, len * count)
          const { left, right } = flanking(state, start, total, opts.strict)
          if (!left && !right) return false
          // matched!
          for (let i = 0; i < count; i++) {
            state.push('text', '', 0).content = opts.delimiter as string
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
          state.pos += len * count
          return true
        }
      })
      if (!useSingleToken) md.inline.ruler2.after('emphasis', opts.name, (state) => {
        convertDelimiters(opts, marker, state, state.delimiters)
        // Not sure what this code is actually for, but it's in the standard markdown-it plugins.
        if (state.tokens_meta) for (const token of state.tokens_meta) {
          if (token?.delimiters) convertDelimiters(opts, marker, state, token.delimiters)
        }
        return true
      })
    }

    if (opts.render) md.renderer.rules[name] = (tokens, idx) => { return (opts.render as any)(tokens[idx].markup) }
    else {
      if (opts.open) md.renderer.rules[name + '_open'] = opts.open
      if (opts.close) md.renderer.rules[name + '_close'] = opts.close
    }
  }
}

// const UNESCAPE_RE = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g

function inlineTokenize(state: StateInline, start: number, end: number) {
  const max = state.posMax
  state.pos = start
  state.posMax = end
  state.md.inline.tokenize(state)
  state.pos = end
  state.posMax = max
}

function flanking(state: StateInline, start: number, delimiter: string, strict: boolean) {
  const len = delimiter.length
  // last and next characters are treated as whitespace if at start/end of string
  const last = start > 0 ? state.src.charCodeAt(start - 1) : 0x20
  const next = start + len < state.posMax ? state.src.charCodeAt(start + len) : 0x20

  const isLastPunct = state.md.utils.isMdAsciiPunct(last) || state.md.utils.isPunctChar(String.fromCharCode(last))
  const isNextPunct = state.md.utils.isMdAsciiPunct(next) || state.md.utils.isPunctChar(String.fromCharCode(next))
  const isLastWhiteSpace = state.md.utils.isWhiteSpace(last)
  const isNextWhiteSpace = state.md.utils.isWhiteSpace(next)

  let left = true, right = true
  if (isNextWhiteSpace) left = false
  else if (isNextPunct) {
    if (!(isLastWhiteSpace || isLastPunct)) left = false
  }
  if (isLastWhiteSpace) right = false
  else if (isLastPunct) {
    if (!(isNextWhiteSpace || isNextPunct)) right = false
  }
  if (strict) {
    left = left && (!right || isLastPunct)
    right = right && (!left || isNextPunct)
  }

  return { left, right }
}

function numDelimiters(state: StateInline, start: number, delimiter: string) {
  const len = delimiter.length
  let count = 0
  while (state.src.substr(start + (len * count), len) === delimiter && (start + (len * count)) < state.posMax)
    count++
  return count
}

const convertDelimiters =
  (opts: InlineSyntaxOpts, marker: number, state: StateInline, delimiters: StateInline.Delimiter[]) => {
    for (const startDelimiter of delimiters) {
      if (startDelimiter.marker !== marker) continue
      if (startDelimiter.end === -1) continue
      const endDelimiter = delimiters[startDelimiter.end]
      const startToken = state.tokens[startDelimiter.token]
      startToken.type = opts.name + '_open'
      startToken.nesting = 1
      const endToken = state.tokens[endDelimiter.token]
      endToken.type = opts.name + '_close'
      endToken.nesting = -1
      for (const token of [startToken, endToken]) {
        token.tag = opts.tag as string
        token.markup = opts.delimiter as string
        token.content = ''
      }
    }
  }