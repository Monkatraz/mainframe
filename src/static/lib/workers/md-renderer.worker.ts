/**
 * @file Serves as the asynchronous markdown-it render worker for Mainframe.
 * @author Monkatraz
 */
// Worker Handler
import { expose, Transfer } from 'threads'
// Imports
import MarkdownIt from 'markdown-it'
import MDMultiMDTables from 'markdown-it-multimd-table'
import MDDefLists from 'markdown-it-deflist'
import katex from 'katex'
// Import Prism
import type { } from 'prismjs' // haha uhh don't question this
import '@vendor/prism.js'
const Prism = self.Prism
// Used for md-it extensions
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'
import type Token from 'markdown-it/lib/token'
import ParserInline from 'markdown-it/lib/parser_inline'

// Before you dig into the depths of this file, read this:
//  1. Mainframe /differs from the fundamental syntax of the Commonmark spec in some ways./
//    The most glaring difference is the handling of *, _, **, __.
//    This is done because, well, it could be done, and because I think the syntax I came up with is /better./
//    And regardless, at least in all the ways that matter, I think it's still Markdown.
//  2. This library is really messy, and it's "intentional".
//    Parsers are really messy, and this is basically a library for quickly generating one.
//    Markdown syntax can now be easily modified, or in this case, massively extended.
//    It's not like I'm over-complicating things either.
//    The standard markdown-it plugins have a lot of boilerplate that this library avoids.
//
// If the syntax's differences from Markdown were too contentious, they can easily be reverted.

// If you are worried about the performance of this renderer, don't be.
// The main bottlenecks will be when the DOM is updated, and not the renderer.

// TODO: nicer line break behavior? may not be easy to implement
// TODO: autoconvert wiki links
// TODO: anchors on headings
// TODO: compare Wikidot typography replacements vs markdown-it
// TODO: Basic grid markup that isn't tables
// TODO: Built-in ACS module
// TODO: Table of contents module

// ?:::collapsible [label-closed] [label-opened] -> block -> :::
//  uses <details> and <summary>
// ? figure, imgcaption, tabview, ACS, chartjs?, mermaid?, tooltips
// ? citations
// ? *[]: | abbr def. | find alternative syntax?
// ? text alignment: ':--', ':--:', '--:' (matches tables)
// ? dl -> ...(dt -> dd) -> dl | term -> \t~ definition

// { attrs: /.*?(?<!])(?=:)/ },

// ? yaml/json/kv front matter
// set render flags?
// themes?

// available symbols:
// inline: ++ | ~~ | % | ,, | @[]
// block: ::: | :-- :--: --: | = | < | > | +++

// comments
// '//'
// '/*' -> block, inline -> '*/'

// code:
// ``` -> block ```
// ```lang -> block ```
// `inline` | monospace
// `lang|inline` | inline code

// inline:
// /  -> <i>
// _  -> <em>
// \*  -> <b>
// \** -> <strong>
// __ -> <u>
// ^  -> <sup>
// ~  -> <sub>
// ? /\^\d[\d,]*\b/ | x^1 only
// ? /~\d[\d,]*\b/ | x~1 only
// -- -> <s>
// == -> <mark>
// @@ -> (escaping)
// ? ^[inline footnote]

// $tex-expression$ -> Katex powered tex expressions
// $$$ -> tex-expression-block -> $$$

// criticmarkup
// {++ ++}    addition
// {-- --}    deletion
// {~~ ~> ~~} substitution
// {== ==}    highlight
// {>> <<}    comment

// inline formatting elements:
// #color col|...|#
// #font family weight mul|...|#
// #class ...classes|...]
// ? #style css|...|#
// ? #<tag> attrs|...|#

// basic blocks
// ? collapsible +++ summary -> details
// ? easy line break | ___
// ? | left side column
// ? nestable MD tags

// preprocessor:
// ? [myvar]: my variables value | to use: @[myvar] <- (inserts "my variables value")

// ? variable conditionals
// protected keywords: if|unless|elif|else, is|isnt|and|or|defined
// cond: @[var] -> (is|isnt) -> (defined|val)
// conj: and|or
// conds: cond ?> ...(conj -> cond)
// op: if|unless|elif|else : if|unless conds ?> ...elif conds ?> else
// condEval(string) fn, split by /\b(and|or)\b/
// inline:
//  [#if|unless conds# inline] ?> ...[#elif cond# inline] ?> [#else# inline]
// block:
//  #if|unless cond -> block ?> ...#elif cond -> block ?> #else -> block -> #end

// ? user-made modules
// editor may be able to auto-suggest (with a hover or something) parameters
// introduce a plugin "context" and merge imports into it
// [:cmp attrs?: inline]
// :::cmp attrs? -> block -> :::
// @module | @module is a private form of @export
// @export [:cmp attrsdef?: -> block -> ]
// @export :::cmp attrsdef? -> block -> :::
// introduces implicit vars: @[block]
// @import ...target from (path)
// chain: /@import\s/, { module: /\w+/, delimit: /,\s*/, repeat: true }, /\sfrom\s/, /\(/, 'path', /\)/

// ? maybe
// auto-link 'SCP-num' tokens
// [DATA EXPUNGED] auto detect?
// [ ] -> <input type=checkbox disabled>
// [x] -> <input type=checkbox disabled checked>

// ? attrsdef: ![param] (defined default parameter) | ...([param]: default (defined) | [name] (undefined))
// const parseKeyVals = syntaxChain('keyvals',
//   [/\s*\[/, 'key', /]:?\s*/, { val: /./, repeat: true, optional: true }], { loop: true }).parse
// function mapKeyVals(str: string) {
//   const { passed, tokens } = parseKeyVals(str, 0)
//   const keyvals = new Map<string, string>()
//   if (passed) tokens.forEach((token, idx) => {
//     if (token[0] === 'ident') keyvals.set(token[3], '')
//     else if (token[0] === 'val') keyvals.set(tokens[idx - 1][3], token[3])
//   })
//   return keyvals
// }

// -- CACHE

/** General purpose cache for the renderer. */
const mdCache: Map<number, any> = new Map()

// https://stackoverflow.com/a/8831937
// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0#gistcomment-2694461
function quickHash(s: string) {
  let h = 0
  for (const c of s)
    h = Math.imul(31, h) + c.charCodeAt(0) | 0
  return h
}

// https://stackoverflow.com/a/11900218
function roughSizeOfObject(object: any) {
  const objectList = []
  const stack = [object]
  let bytes = 0
  while (stack.length) {
    const value = stack.pop()
    if (typeof value === 'boolean') bytes += 4
    else if (typeof value === 'string') bytes += value.length * 2
    else if (typeof value === 'number') bytes += 8
    else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
      objectList.push(value)
      for (const i in value) stack.push(value[i])
    }
  }
  return bytes
}

// TODO: in edit mode prevent the caching of the most recently edited line
// could do this with debouncing?

/** A function that caches the results of functions based off an unique ID.
 *  The ID itself is hashed into a small number - so feed in as big of a string as you want for the ID.
 *  Used within the renderer widely to massively improve the performance of code blocks and tex expressions.
 *  This is an absolutely essential optimization in the live preview mode of the editor.
 */
function cache<T extends WrappedFn<any>>(fn: T, id: string): ReturnType<T> {
  const hash = quickHash(id)
  if (mdCache.has(hash)) {
    const result = mdCache.get(hash)
    // This usually clears the cache at about 300-700kb.
    // Which really, is just not a large amount of memory to be using for this.
    if (mdCache.size > 512) {
      const size = Math.round(roughSizeOfObject(Array.from(mdCache)) / 1024)
      console.info(`[md-renderer] Cache flushed. Rough size: ${size}kb`)
      mdCache.clear()
    }
    return result
  } else {
    const result = fn()

    let doCache = true
    // some basic checks to avoid caching stupidly huge objects
    if (typeof result === 'string' && result.length > 65536) doCache = false
    else if (result instanceof Array && result.length > 128) doCache = false

    if (doCache) mdCache.set(hash, result)
    return result
  }
}

// This is some wizardy - but we're replacing the standard markdown-it parser handler with our own.
// The reason why is so that we can cache /entire blocks/, and improve live preview performance.
ParserInline.prototype.parse = function (str, md, env, outTokens) {
  const state = new this.State(str, md, env, outTokens)
  // The magic! markdown-it mutates the outTokens array, so we need to as well.
  let mutated = false
  const tokens = cache(() => {
    this.tokenize(state)
    const rules = this.ruler2.getRules('')
    const len = rules.length
    for (let i = 0; i < len; i++) rules[i](state)
    mutated = true
    return outTokens
  }, str + '##PARSER_INLINE##')
  // mutation garbage.....
  if (!mutated) tokens.forEach(token => outTokens.push(token))
}

// -- SYNTAX EXTENSIONS

const TERMINATOR_RE = /[\n!#$%&*+\-:<=>@[\\\]^_`{}~/|]/
const synExt = [
  ...[
    ['/', 'i'], ['_', 'em'],
    ['*', 'b'], ['**', 'strong'],
    ['__', 'u']
  ].map(arr => syntaxWrap({ symb: arr[0], tag: arr[1], strict: true })),

  ...[
    ['--', 's'],
    ['^', 'sup'], ['~', 'sub'],
    ['==', 'mark']
  ].map(arr => syntaxWrap({ symb: arr[0], tag: arr[1] })),

  // Comments
  syntaxBlock({ symb: ['/*', '*/'], render: () => '' }),
  syntaxBrackets({ symb: ['/*', '*/'], render: () => '' }),
  syntaxLine({ symb: '//', render: () => '' }),

  // CriticMarkup
  syntaxBrackets({ symb: ['{++', '++}'], tag: 'ins' }),
  syntaxBrackets({ symb: ['{--', '--}'], tag: 'del' }),
  syntaxBrackets({ symb: ['{==', '==}'], tag: 'mark', class: 'critic-highlighted' }),
  syntaxBrackets({ symb: ['{>>', '<<}'], tag: 'span', class: 'critic-metadata' }),
  syntaxChain('critic_substitution', parserChain([
    { match: /{~~/, tag: 'span' },
    { match: /.*?/, tag: 'del/' },
    { match: /~>/, type: 'arrow' },
    { match: /.*?/, tag: 'ins/' },
    { match: /~~}/, tag: '/span' }
  ]), {
    parse: {
      arrow: (state, name) => {
        state.push(name + '_open', 'span', 1).attrSet('class', 'critic-sub-arrow')
        state.push('text', '', 0).content = '⇝'
        state.push(name + '_close', 'span', -1)
      }
    }
  }),

  // Katex
  syntaxWrap({
    symb: '$', ignoreFlanking: true,
    render: str => cache(() => katex.renderToString(str, { throwOnError: false }), str + '##KATEX##')
  }),
  syntaxBlock({
    symb: ['$$$', '$$$'],
    render: str => cache(() => katex.renderToString(str, { throwOnError: false }), str + '##KATEX##')
  }),

  // Inline Elements | #elem param param|text|#
  // opens a generic inline element span
  syntaxChain('inline-span', parserChain([
    { match: /#/, tag: 'span' },
    { match: /\w+/, type: 'type' },
    { match: /\s*/ },
    { match: /[^#|]*?/, sub: { type: 'param', match: /.+?(?:\s|$)/g } },
    { match: /\|\s*/ }
  ]), {
    after: 'image',
    parse: {
      type: (state, name, tokenIR, idx, tokens) => {
        const token = state.tokens[state.tokens.length - 1] // start span token
        switch (tokenIR.text) {
          case 'font': {
            let family = '', weight = '', size = ''
            for (const param of tokens) if (param.type === 'param') {
              if (/^(\d{3}|bolder|lighter|bold|light)$/.test(param.text)) weight = param.text
              else if (/^[\d.]+?(%|\w{2,})$/.test(param.text)) size = param.text
              else family = param.text
            }
            token.attrSet('style', inlineStyle({ 'font-weight': weight, 'font-size': size }))
            if (family) token.attrJoin('class', 'fs-' + family)
            break
          }
          // This is a repeated pattern, so this wacky syntax makes this a bit more concise.
          default: for (const param of tokens) if (param.type === 'param') switch (tokenIR.text) {
            case 'class': token.attrJoin('class', param.text); break
            case 'color': token.attrSet('style', inlineStyle({ color: param.text })); break
          }
        }
      }
    }
  }),
  // closes a inline-element span
  syntaxSymbol({ symb: '|#', tag: '/span' }),

  // Inline code blocks
  syntaxChain('inline-code', parserChain([
    { match: /`+/ },
    { match: /\w+/, type: 'lang' },
    { match: /\s*\|\s*/ },
    { match: /.*?/, type: 'code' },
    { match: /`+/, tag: '/code' }
  ]), {
    after: 'escape',
    parse: {
      lang: (state, name, tokenIR) => {
        state.push(name, 'code', 1)
          .attrSet('class', `code language-${tokenIR.text}`)
      },
      code: (state, name, tokenIR, idx, tokens) => {
        const lang = tokens[idx - 2].text
        const token = state.push('fence-inline', 'code', 0)
        token.info = lang
        token.content = tokenIR.text
      }
    }
  }),

  (md: MarkdownIt) => md.renderer.rules['fence-inline'] = (tokens, idx, opts) => {
    const token = tokens[idx]
    if (opts.highlight) return opts.highlight(token.content, token.info, '')
    return md.utils.escapeHtml(token.content)
  },

  // Escaping text
  syntaxWrap({ symb: '@@', ignoreFlanking: true, render: str => str }),

  // Imported plugins.
  MDMultiMDTables,
  MDDefLists,

  // Disables syntax that we replaced or that we don't want.
  (md: MarkdownIt) => md.disable('strikethrough').disable('emphasis').disable('code'),

  // Post render operations
  // onEachToken('fence', (token) => { if (token.info) token.attrJoin('class', 'code') }),
  // (md: MarkdownIt) => md.core.ruler.push('export_state', (state) => {
  //   tunnelTokens(Array.from(state.tokens))
  //   return true
  // }),

  // Sets the data-line attribute on tokens with line mapping information available.
  // This allows the editor to synchronize the rendered view and the editor view.
  (md: MarkdownIt) => md.core.ruler.push('line_numbers', (state) => {
    state.tokens.forEach((token) => {
      if (token.map) token.attrSet('data-line', String(token.map[0]))
    })
    return true
  }),

  // This parser replaces the original text token with a slightly less efficient one.
  // However, this function allows you to extend what is considered a terminator character to the parser.
  // The source of this function actually comes from markdown-it, it's just commented out.
  // As an example of why this matters, /italics/ wouldn't work without this.
  (md: MarkdownIt) => md.inline.ruler.at('text', (state, silent) => {
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

]

// -- EXPORT RENDERER

// let exportTokens: any
// const tunnelTokens = (tokens: StateCore['tokens']) => exportTokens = tokens
const renderer = new MarkdownIt({
  html: true, linkify: true, typographer: true,
  // Hooks up Prism to our renderer
  highlight(str, lang, attrs) {
    const id = str + '##LANG:' + lang + '##'
    if (lang in Prism.languages)
      return cache(() => Prism.highlight(str, Prism.languages[lang], lang), id)
    else return ''
  }
})
synExt.map(renderer.use, renderer)

interface TypedArray extends ArrayBuffer { buffer: ArrayBufferLike }
type RawMarkdown = string | ArrayBuffer | TypedArray

const decoder = new TextDecoder()
const encoder = new TextEncoder()
const transfer = (buffer: RawMarkdown) => {
  if (typeof buffer === 'string')    return Transfer(encoder.encode(buffer).buffer)
  if ('buffer' in buffer)            return Transfer(buffer.buffer)
  if (buffer instanceof ArrayBuffer) return Transfer(buffer)
  throw new TypeError('Expected a string, ArrayBuffer, or Uint8Array!')
}
const decode = (buffer: ArrayBuffer) => decoder.decode(buffer)

// see `modules/markdown.ts` for docs. and type definitions
// this just implements the MarkdownWorker interface found there
expose({

  render(buffer: ArrayBuffer) {
    const str = decode(buffer)
    return transfer(renderer.render(str))
  },

  highlight(buffer: ArrayBuffer, lang: string) {
    const str = decode(buffer)
    if (lang in Prism.languages)
      return transfer(Prism.highlight(str, Prism.languages[lang], lang))
    else throw new Error('Invalid language!')
  }

})

// -- UTILITY FUNCTIONS

function inlineStyle(obj: Record<string, string>) {
  const props = []
  for (const prop in obj) if (obj[prop]) props.push(`${prop}: ${obj[prop]}`)
  return props.join(';')
}

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
  if (isLastWhiteSpace) right = false
  if (strict) {
    if (isNextPunct && !isLastWhiteSpace) left = false
    if (isLastPunct && !isNextWhiteSpace) right = false

    if (!isLastPunct && !isLastWhiteSpace && !isNextPunct && !isNextWhiteSpace) {
      left = false, right = false
    }
  }

  return { left, right }
}

function parseTag(tag: string): [string, -1 | 0 | 1] {
  let nesting: -1 | 0 | 1 = 1
  if (tag.startsWith('/')) nesting = -1
  else if (tag.endsWith('/')) nesting = 0
  return [tag.replace('/', ''), nesting]
}

// -- MISC. PARSER/PLUGIN GENERATOR FUNCTIONS

type ChainSub = { type: string, match: RegExp, tag?: string }

interface ChainRule {
  match: RegExp
  type?: string
  sub?: ChainSub
  tag?: string
}

interface ChainIR {
  regex: RegExp
  groups: { type: string, tag: string, sub?: ChainSub }[]
}

interface ChainToken {
  type: string
  text: string
  start: number
  end: number
  tag: string
}

function parserChain(chain: ChainRule[]) {
  const chainIR: ChainIR = { regex: RegExp(''), groups: [] }
  let regex = ''
  for (const rule of chain) {
    regex += `(${rule.match.source})`
    chainIR.groups.push({ type: rule?.type ?? '', tag: rule?.tag ?? '', sub: rule.sub })
  }
  chainIR.regex = RegExp(regex)

  return (src: string) => {
    const match = chainIR.regex.exec(src)
    const tokens: ChainToken[] = []
    if (!match || match.index !== 0) return false
    const length = match.shift()?.length ?? 0 // removes the 'total result'
    let idx = 0
    let pos = 0
    for (const text of match) {
      const start = pos
      const group = chainIR.groups[idx]
      idx++
      if (!text) continue
      pos += text.length
      // Normal group
      if (!group.sub) tokens.push({
        type: group.type, text, start: start, end: pos, tag: group.tag
      })
      else {
        // Repeating global subgroup
        const sub = src.substr(start, text.length)
        const submatches = sub.matchAll(group.sub.match)
        pos = start
        for (const submatch of submatches) {
          const substart = pos
          const index = submatch?.index ?? 0
          pos = start + index + submatch[0].length
          tokens.push({
            type: group.sub.type, text: submatch[0], start: substart + index, end: pos, tag: group.sub.tag ?? ''
          })
        }
      }
    }
    return { tokens, length }
  }
}

function onEachToken(onToken: string, fn: (token: Token) => void) {
  return (md: MarkdownIt) => {
    md.core.ruler.push(onToken + '_post_tokenized', (state) => {
      state.tokens
        .filter(token => token.type === onToken)
        .forEach(token => fn(token))
      return true
    })
  }
}

// -- BLOCK PARSER/PLUGIN GENERATOR FUNCTIONS

function syntaxBlock(opts: { symb: [string, string], tag?: string, render?: (contents: string) => string }) {
  if (!opts.tag) opts.tag = ''
  const type = opts.symb + (opts.tag !== '' ? opts.tag : '_synExt')
  return (md: MarkdownIt) => {
    md.block.ruler.after('blockquote', type, (state, startLine, endLine, silent) => {
      if (silent) return false
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const [symbStart, symbEnd] = opts.symb
      const [lenStart, lenEnd] = [symbStart.length, symbEnd.length]
      if ((start + lenStart) > max) return false
      if (state.src.substr(start, lenStart) !== symbStart) return false

      let nextLine = startLine
      while (nextLine <= endLine) {
        nextLine++
        if (nextLine > endLine) return false
        const start = state.bMarks[nextLine] + state.tShift[nextLine]
        const max = state.eMarks[nextLine]
        if ((start + lenEnd) > max) continue
        // check if the block end symbol is at the end of our line
        if (state.src.substr(start, max - start).trim().endsWith(symbEnd)) break
        // check at start of line
        if (state.src.substr(start, lenEnd) !== symbEnd) continue
        // matched!
        break
      }
      state.line = nextLine + 1
      const len = state.sCount[startLine]

      if (!opts.render) {
        const token = state.push(type, opts.tag as string, 0)
        token.content = state.getLines(startLine + 1, nextLine, len, true)
        token.markup = symbStart
        token.map = [startLine, state.line]
      } else {
        state.push('block_wrapper_open', 'div', 1)
          .map = [startLine, state.line]
        state.push(type, opts.tag as string, 0)
          .markup = state.getLines(startLine + 1, nextLine, len, true)
        state.push('block_wrapper_close', 'div', -1)
      }

      return true
    })
    if (opts.render) md.renderer.rules[type] = (tokens, idx) => (opts.render as any)(tokens[idx].markup)
  }
}

function syntaxLine(opts: { symb: string, tag?: string, render?: (contents: string) => string }) {
  if (!opts.tag) opts.tag = ''
  const type = opts.symb + (opts.tag !== '' ? opts.tag : '_synExt')
  return (md: MarkdownIt) => {
    md.block.ruler.after('blockquote', type, (state, startLine, endLine, silent) => {
      if (silent) return false
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const len = opts.symb.length
      if ((start + len) > max) return false
      if (state.src.substr(start, len) !== opts.symb) return false

      state.line = startLine + 1

      if (!opts.render) {
        const startToken = state.push(type + '_open', opts.tag as string, 1)
        startToken.markup = opts.symb
        startToken.map = [startLine, state.line]

        const inline = state.push('inline', '', 0)
        inline.content = state.src.substr(start + len, max)
        inline.map = [startLine, state.line]
        inline.children = []

        const endToken = state.push(type + '_close', opts.tag as string, -1)
        endToken.markup = opts.symb
      } else
        state.push(type, opts.tag as string, 0)
          .markup = state.src.substr(start + len, max)

      return true
    })
    if (opts.render) md.renderer.rules[type] = (tokens, idx) => (opts.render as any)(tokens[idx].markup)
  }
}

// -- INLINE PARSER/PLUGIN GENERATOR FUNCTIONS

interface SyntaxChainOpts {
  after?: string
  parse?: Record<string, (state: StateInline, name: string, token: ChainToken, idx: number, tokens: ChainToken[]) => void>
}

// TODO: render func.
function syntaxChain(name: string, parse: ReturnType<typeof parserChain>, opts: SyntaxChainOpts = {}) {
  return (md: MarkdownIt) => {
    md.inline.ruler.after(opts?.after ?? 'emphasis', name, (state, silent) => {
      if (silent) return false
      const start = state.pos
      const result = parse(state.src.substr(start))
      if (!result) return false
      const { tokens, length } = result

      let idx = 0
      for (const token of tokens) {
        const tokenName = name + '_' + token.type
        if (token.type === 'nest') inlineTokenize(state, start + token.start, start + token.end)
        else if (token.type === 'text') state.push('text', '', 0).content = token.text
        else if (opts?.parse && token.type in opts.parse)
          opts.parse[token.type].bind(md)(state, tokenName, token, idx, tokens)
        else if (token.tag) {
          const [tag, nesting] = parseTag(token.tag)
          if (nesting !== 0) state.push(tokenName, tag, nesting).markup = token.text
          else {
            state.push(tokenName + '_open', tag, 1)
            inlineTokenize(state, start + token.start, start + token.end)
            state.push(tokenName + '_close', tag, -1)
          }
        }
        idx++
      }

      state.pos = start + length
      return true
    })
  }
}

function syntaxWrap(
  opts: {
    symb: string, tag?: string, ignoreFlanking?: boolean, strict?: boolean
    render?: (contents: string) => string
  }) {
  return (md: MarkdownIt) => {
    if (!opts.tag) opts.tag = ''
    const type = opts.symb + (opts.tag !== '' ? opts.tag : '_synExt')
    // Generates a unique number from the input symbol (used by md delimiters)
    const marker = parseInt(opts.symb.split('')
      .reduce((acc: string, cur: string) => acc + '0' + cur.charCodeAt(0), ''))
    md.inline.ruler.after('emphasis', type, (state, silent) => {
      if (silent) return false
      const start = state.pos
      const max = state.posMax
      const len = opts.symb.length
      if (start + len > max) return false
      // check for consecutive delimiters (parsed as one delimiter, but tokenized as multiple)
      let count = 0
      while (state.src.substr(start + (len * count), len) === opts.symb && (start + (len * count)) < max)
        count++
      if (!count) return false
      const { left, right } = flanking(state, start, state.src.substr(start, len * count), opts.strict ?? false)
      if (!opts.ignoreFlanking && !left && !right) return false
      // we only care about the end delimiter if we're using a render function
      // if we're not, we just want to tokenize the delimiters themselves
      if (opts.render) {
        // check end delimiter
        let pos = start + (len * count)
        for (; pos < max; pos++)
          if (state.src.substr(pos, len) === opts.symb) {
            const { left, right } = flanking(state, pos, opts.symb, opts.strict ?? false)
            if (!opts.ignoreFlanking && !left && !right) continue
            break
          }
        if (pos === max) return false
        // end delimiter matched!
        state.push(type, opts.tag as string, 0)
          .markup = state.src.substr(start + len, pos - (start + len))
        state.pos = pos + len
      } else {
        // push every delimiter we found (e.g. '****' -> '**', '**')
        for (let i = 0; i < count; i++) {
          state.push('text', '', 0).content = opts.symb
          state.delimiters.push({
            marker: marker,
            length: count,
            jump: i,
            token: state.tokens.length - 1,
            end: -1,
            open: !opts.ignoreFlanking ? left : true,
            close: !opts.ignoreFlanking ? right : true
          })
        }
        state.pos += len * count
      }
      return true
    })
    if (!opts.render) {
      const convertDelimiters = (state: StateInline) => {
        for (const startDelimiter of state.delimiters) {
          if (startDelimiter.marker !== marker || startDelimiter.end === -1) continue
          const tokens = [
            state.tokens[startDelimiter.token],
            state.tokens[state.delimiters[startDelimiter.end].token]]
          tokens.forEach((token, idx) => {
            token.type = type + (idx ? '_close' : '_open')
            token.nesting = idx ? -1 : 1
            token.tag = opts.tag as string
            token.markup = opts.symb
            token.content = ''
          })
        }
      }
      md.inline.ruler2.after('emphasis', type, (state) => {
        convertDelimiters(state)
        // Not sure what this code is actually for, but it's in the standard markdown-it plugins.
        if (state.tokens_meta) for (const token of state.tokens_meta)
          if (token?.delimiters) convertDelimiters(state)
        return true
      })
    }
    else md.renderer.rules[type] = (tokens, idx) => (opts.render as any)(tokens[idx].markup)
  }
}

function syntaxBrackets(opts: {
  symb: [string, string], tag?: string, class?: string, render?: (contents: string) => string
}) {
  return (md: MarkdownIt) => {
    if (!opts.tag) opts.tag = ''
    const type = opts.symb[0] + opts.symb[1] + (opts.tag !== '' ? opts.tag : '_synExt')
    md.inline.ruler.after('emphasis', type, (state, silent) => {
      if (silent) return false
      const start = state.pos
      const max = state.posMax
      const [symbLeft, symbRight] = opts.symb
      const [lenLeft, lenRight] = [symbLeft.length, symbRight.length]
      const posStart = start + lenLeft
      if (posStart > max) return false
      if (state.src.substr(start, lenLeft) !== symbLeft) return false
      // check end delimiter
      let pos = posStart
      let nesting = 1
      for (; pos < max; pos++) {
        if (state.src.substr(pos, lenLeft) === symbLeft) nesting++
        else if (state.src.substr(pos, lenRight) === symbRight) nesting--
        if (nesting === 0) break
      }
      if (pos === max) return false
      // end delimiter matched!
      if (opts.render) state.push(type, opts.tag as string, 0)
        .markup = state.src.substr(posStart, pos - posStart)
      else {
        const startToken = state.push(type, opts.tag as string, 1)
        if (opts.class) startToken.attrSet('class', opts.class)
        inlineTokenize(state, posStart, pos)
        state.push(type, opts.tag as string, -1)
      }
      state.pos = pos + lenRight
      return true
    })
    if (opts.render) md.renderer.rules[type] = (tokens, idx) => (opts.render as any)(tokens[idx].markup)
  }
}

function syntaxSymbol(opts: { symb: string, tag?: string, render?: (contents: string) => string }) {
  return (md: MarkdownIt) => {
    if (!opts.tag) opts.tag = ''
    const type = opts.symb + (opts.tag !== '' ? opts.tag : '_synExt')
    md.inline.ruler.after('emphasis', type, (state, silent) => {
      if (silent) return false
      const start = state.pos
      const len = opts.symb.length
      if (start + len > state.posMax) return false
      if (state.src.substr(start, len) !== opts.symb) return false
      // matched!
      state.push(type, ...parseTag(opts.tag as string))
        .markup = state.src.substr(start, len)
      state.pos = start + len
      return true
    })
    if (opts.render) md.renderer.rules[type] = (tokens, idx) => (opts.render as any)(tokens[idx].markup)
  }
}
