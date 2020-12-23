/**
 * @file Serves as the asynchronous markdown-it render worker for Mainframe.
 * @author Monkatraz
 */
// Imports
import MarkdownIt from 'markdown-it'
import MDMultiMDTables from 'markdown-it-multimd-table'
import MDDefLists from 'markdown-it-deflist'
import katex from 'katex'
// Used for md-it extensions
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'
import type Token from 'markdown-it/lib/token'

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
// block: ::: | :-- :--: --: | = | < | >

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
//\*  -> <b>
//\** -> <strong>
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
// ? easy line break | ___
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


// -- SYNTAX EXTENSIONS

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

const TERMINATOR_RE = /[\n!#$%&*+\-:<=>@[\\\]^_`{}~/|]/
const synExt = [
  // e.g. '**' -> <strong> mappings
  ...[
    ['/', 'i'], ['_', 'em'],
    ['*', 'b'], ['**', 'strong'],
    ['__', 'u'],
    ['--', 's'],
    ['^', 'sup'], ['~', 'sub'],
    ['==', 'mark']
  ].map((arr) => syntaxWrap({ symb: arr[0], tag: arr[1] })),

  // Comments (follows JS syntax entirely)
  syntaxChain('inline-comment', parserChain([{ match: /\/\/.*$/ }])),
  syntaxBrackets({ symb: ['/*', '*/'], render: () => '' }),
  syntaxBlock({ symb: ['/*', '*/'], render: () => '' }),
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
  syntaxWrap({ symb: '$', render: (str) => katex.renderToString(str, { throwOnError: false }) }),
  syntaxBlock({ symb: ['$$$', '$$$'], render: (str) => katex.renderToString(str, { throwOnError: false }) }),

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
      'type': (state, name, tokenIR, idx, tokens) => {
        const token = state.tokens[state.tokens.length - 1] // start span token
        switch (tokenIR.text) {
          case 'font': {
            let family = '', weight = '', size = ''
            for (const param of tokens) if (param.type === 'param') {
              if (param.text.match(/^[\d.]+?(%|\w{2,})$/)) size = param.text
              else if (/^(\d{3}|bolder|lighter|bold|light)$/.test(param.text)) weight = param.text
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
    { match: /`+/, tag: 'code' },
    { match: /\w+/, type: 'lang' },
    { match: /\s*\|\s*/ },
    { match: /.*?/, type: 'text' },
    { match: /`+/, tag: '/code' }
  ]), {
    after: 'escape',
    parse: {
      'lang': (state, name, tokenIR, idx, tokens) => {
        const token = state.tokens[state.tokens.length - 1]
        token.attrSet('class', 'language-' + tokenIR.text)
      }
    }
  }),

  // Escaping text
  syntaxWrap({ symb: '@@', render: (str) => str }),

  // Imported plugins.
  MDMultiMDTables,
  MDDefLists,

  // Disables syntax that we replaced or that we don't want.
  (md: MarkdownIt) => md.disable('strikethrough').disable('emphasis').disable('code'),

  // Post render operations
  // onEachToken('heading_open', (token) => { token.attrJoin('class', 'heading') }),
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
const renderer = new MarkdownIt({ html: true, linkify: true, typographer: true })
synExt.map(renderer.use, renderer)

onmessage = (evt) => {
  try {
    postMessage(renderer.render(evt.data))
  } catch (err) {
    postMessage(String(err))
  }
}

// -- UTILITY FUNCTIONS

function inlineStyle(obj: { [prop: string]: string }) {
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
    const match = src.match(chainIR.regex)
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
      } else
        state.push(type, opts.tag as string, 0)
          .markup = state.getLines(startLine + 1, nextLine, len, true)

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
  parse?: {
    [K: string]:
    (state: StateInline, name: string, token: ChainToken, idx: number, tokens: ChainToken[]) => void
  }
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

function syntaxWrap(opts: { symb: string, tag?: string, render?: (contents: string) => string }) {
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
      const { left, right } = flanking(state, start, state.src.substr(start, len * count), false)
      if (!left && !right) return false
      // we only care about the end delimiter if we're using a render function
      // if we're not, we just want to tokenize the delimiters themselves
      if (opts.render) {
        // check end delimiter
        let pos = start + (len * count)
        for (; pos < max; pos++)
          if (state.src.substr(pos, len) === opts.symb) {
            const { left, right } = flanking(state, start, opts.symb, false)
            if (!left && !right) continue
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
            open: left,
            close: right
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