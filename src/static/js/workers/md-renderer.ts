/**
 * @file Serves as the asynchronous markdown-it render worker for Mainframe.
 * @author Monkatraz
 */
// Imports
import MarkdownIt from 'markdown-it'
import katex from 'katex'
// Used for md-it extensions
import type { RenderRule } from 'markdown-it/lib/renderer'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'
import type Token from 'markdown-it/lib/token'

// ! Before you dig into the depths of this file, read this:
// I want two things to be noted:
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

// TODO: Generic (block -> tag) handler
// TODO: Generic (lineSymbol -> tag) handler
// TODO: autoconvert wiki links
// TODO: anchors on headings
// TODO: compare Wikidot typography replacements vs markdown-it
// TODO: Basic grid markup that isn't tables
// TODO: Built-in ACS module

// ?:::collapsible [label-closed] [label-opened] -> block -> :::
//  uses <details> and <summary>
// ? figure, imgcaption, tabview, ACS, chartjs?, mermaid?, tooltips
// ? citations
// ? *[]: | abbr def. | find alternative syntax?
// ? text alignment: ':--', ':--:', '--:' (matches tables)
// ? dl -> ...(dt -> dd) -> dl | term -> \t~ definition

// ? yaml/json/kv front matter
// set render flags?
// themes?

// available symbols:
// inline: ++ | _ | ~~ | % | ,, | {  }
// block: ::: | :-- :--: --: | = | < | >

// basic inline:
// /  -> <i>
//\// -> <em>
//\*  -> <b>
//\** -> <strong>
// __ -> <u>
// ^  -> <sup>
// ~  -> <sub>
// ? /\^\d[\d,]*\b/ | x^1 only
// ? /\~\d[\d,]*\b/ | x~1 only
// -- -> <s>
// == -> <mark>

// advanced inline:
// $tex-expression$ -> Katex powered tex expressions
// ? ^[inline footnote]
// @@ -> (escaping)

// criticmarkup
// {++ ++} -> ins
// {-- --} -> del
// ? {~~ ~> ~~} -> ?
// ? {>> <<} -> ?
// ? {== ==}{>> <<} -> ?

// inline formatting elements:
// #color col|...#
// #font family weight mul|...#
// #class ...classes|...]
// ? #style css|...#
// ? #<tag> attrs|...#

// basic blocks
// ? comments | <!--is unruly-->
// ? easy line break | ___
// ? nestable MD tags
// ? $$$ -> tex-expression-block -> $$$

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
const parseKeyVals = syntaxChain('keyvals',
  [/\s*\[/, 'key', /]:?\s*/, { val: /./, repeat: true, optional: true }], { loop: true }).parse
function mapKeyVals(str: string) {
  const { passed, tokens } = parseKeyVals(str, 0)
  const keyvals = new Map<string, string>()
  if (passed) tokens.forEach((token, idx) => {
    if (token[0] === 'ident') keyvals.set(token[3], '')
    else if (token[0] === 'val') keyvals.set(tokens[idx - 1][3], token[3])
  })
  return keyvals
}

// { attrs: /.*?(?<!])(?=:)/ },
const syntaxChains = {
  spans: syntaxChain('inline-span',
    [
      /#/, { type: /.+?(?=\s|\|)/ }, /\s*/,
      { param: /./, repeat: true, delimit: /\s/ }, /\|\s*/,
      'nest', { close: /#/, tag: '/span' }
    ], {
    after: 'image',
    parse: {
      'type': (state, name, content, idx, tokens) => {
        const token = state.push(name, 'span', 1)
        switch (content) {
          case 'font': {
            let family = '', weight = '', size = ''
            for (const param of tokens) if (param[0] === 'param') {
              if (param[3].endsWith('em')) size = param[3]
              else if (/^(\d{3}|bolder|lighter|bold|light)$/.test(param[3])) weight = param[3]
              else family = param[3]
            }
            token.attrSet('style', objStyle({ 'font-weight': weight, 'font-size': size }))
            if (family) token.attrJoin('class', 'fs-' + family)
            break
          }
          // This is a repeated pattern, so this wacky syntax makes this a bit more concise.
          default: for (const param of tokens) if (param[0] === 'param') switch (content) {
            case 'class': token.attrJoin('class', param[3]); break
            case 'color': token.attrSet('style', 'color: ' + param[3]); break
          }
        }
      }
    }
  })
}

const TERMINATOR_RE = /[\n!#$%&*+\-:<=>@[\\\]^_`{}~/]/
const synExt = [
  // e.g. '**' -> <strong> mappings
  ...[
    ['/', 'i'], ['//', 'em'],
    ['*', 'b'], ['**', 'strong'],
    ['__', 'u'],
    ['--', 's'],
    ['^', 'sup'], ['~', 'sub'],
    ['==', 'mark']
  ].map((arr) => syntaxSymbol({ symb: arr[0], tag: arr[1] })),

  // CriticMarkup
  syntaxBrackets({ symb: ['{++', '++}'], tag: 'ins' }),
  syntaxBrackets({ symb: ['{--', '--}'], tag: 'del' }),

  // Katex
  syntaxSymbol({ symb: '$', render: (str) => katex.renderToString(str, { throwOnError: false }) }),

  // Inline Elements | #elem param param|text#
  syntaxChains.spans.plugin,

  // Escaping text
  syntaxSymbol({ symb: '@@', render: (str) => str }),

  // Post render operations
  // onEachToken('heading_open', (token) => { token.attrJoin('class', 'heading') }),

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
  }),

  // Disables the syntax that we replaced.
  (md: MarkdownIt) => md.disable('strikethrough').disable('emphasis')
]

// -- EXPORT RENDERER

const renderer = new MarkdownIt({ html: true, linkify: true, typographer: true })
synExt.map(renderer.use, renderer)

onmessage = (evt) => {
  try {
    postMessage(renderer.render(evt.data))
  } catch (err) {
    postMessage(err)
  }
}

// -- UTILITY FUNCTIONS

/** Escapes a string for use as a regexp match. */
function escapeRegExp(str: string) {
  return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

function objStyle(obj: { [prop: string]: string }) {
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

// -- PARSER/PLUGIN FUNCTIONS

function chainEsc(symb: ChainSymbol) {
  return typeof symb === 'string' ? RegExp(escapeRegExp(symb)) : symb
}
function chainTag(tag: string): [string, -1 | 0 | 1] {
  let nesting: -1 | 0 | 1 = 1
  if (tag.startsWith('/')) nesting = -1
  else if (tag.endsWith('/')) nesting = 0
  return [tag.replace('/', ''), nesting]
}

// TODO: delimiter nesting
// TODO: flanking, strict
// TODO: render func.
type ChainSymbol = RegExp | string
type ChainSyntax = ChainSymbol | { [name: string]: any }
  & { repeat?: true, optional?: true, delimit?: RegExp, tag?: string }
type ChainSyntaxIR = [symbol: RegExp, name: string, repeat?: true, optional?: true, delimit?: RegExp, tag?: string]
interface ChainOpts {
  loop?: boolean
  after?: string,
  parse?: {
    [K: string]:
    (state: StateInline, name: string, content: string, idx: number, tokens: ChainSyntaxToken[]) => void
  },
  render?: { [K: string]: RenderRule }
}
type ChainSyntaxToken = [string, number, number, string, string]
function syntaxChain(name: string, chain: ChainSyntax[], opts?: ChainOpts) {
  // Process the input chain and cast it into a simpler (or just faster) intermediate representation
  const types: string[] = []
  const syntaxIR: ChainSyntaxIR[] = []
  for (const syntax of chain) {
    // 'token' -> { 'token': /./, repeat: true }
    // /regexp/ -> { then: /regexp/ }
    // { ignore: symbol } -> { then: /regexp/, optional: true }
    // { token: symbol }
    if (typeof syntax === 'string') syntaxIR.push([/./, syntax, true])
    else if (syntax instanceof RegExp) syntaxIR.push([syntax, 'then'])
    else if ('ignore' in syntax) syntaxIR.push(
      [chainEsc(syntax.ignore), 'then', syntax.repeat, true, syntax.delimit, syntax.tag])
    else {
      let name = ''
      for (const prop in syntax) {
        if (['repeat', 'optional', 'delimit', 'tag'].includes(prop) === false) name = prop
      }
      types.push(name)
      syntaxIR.push(
        [chainEsc(syntax[name]), name, syntax.repeat, syntax.optional, syntax.delimit, syntax.tag])
    }
  }
  const parse = (str: string, start: number) => {
    const tokens: [string, number, number, string, string][] = []
    let curSyntaxIdx = 0
    let repeating = false
    let pos = start
    const breakOut = (passed: boolean) => { return { passed, pos, tokens } }
    while (pos < str.length) {
      const [matchSymbol, typeName, isRepeatable, isOptional, delimit, tag] = syntaxIR[curSyntaxIdx]
      const isLastSyntax = curSyntaxIdx === syntaxIR.length - 1

      // skip position on delimiter
      if (delimit) {
        const match = str.substr(pos).match(delimit)
        if (match && match.index === 0) {
          repeating = false
          pos += match[0].length
          if (pos >= str.length && isLastSyntax) return breakOut(true)
          continue
        }
      }
      // start match
      const match = str.substr(pos).match(matchSymbol)
      if (match && match.index === 0) {
        const startPos = pos
        pos += match[0].length

        // check first syntax if we're ready to loop
        if (opts?.loop && isLastSyntax) {
          const match = str.substr(startPos).match(syntaxIR[0][0])
          if (match && match.index === 0) {
            repeating = false, pos = startPos, curSyntaxIdx = 0
            continue
          }
        }

        if (repeating) {
          // check next syntax and bail if it matches
          if (!isLastSyntax) {
            const match = str.substr(startPos).match(syntaxIR[curSyntaxIdx + 1][0])
            if (match && match.index === 0) {
              repeating = false, pos = startPos, curSyntaxIdx++
              continue
            }
          }
          // stick our match on the end of the last one (repeating)
          if (typeName !== 'then') {
            const lastToken = tokens[tokens.length - 1]
            lastToken[2] += match[0].length // end pos
            lastToken[3] += match[0] // contents
          }
          continue
        }

        // matched new syntax
        if (!repeating && typeName !== 'then')
          tokens.push([typeName, startPos, pos, match[0], tag ?? ''])

        if (isRepeatable) repeating = true
        else if (isLastSyntax) return breakOut(true)
        else curSyntaxIdx++

      } else {
        // if this match was optional:
        if (repeating || isOptional) {
          if (isLastSyntax) return breakOut(true)
          repeating = false, curSyntaxIdx++
          continue
        }
        // failed to match
        return breakOut(false)
      }
    }
    // overran EOS
    return breakOut(false)
  }
  const plugin = (md: MarkdownIt) => {
    md.inline.ruler.after(opts?.after ?? 'emphasis', name, (state, silent) => {
      if (silent) return false
      const start = state.pos
      const { passed, pos: parseEnd, tokens } = parse(state.src, start)
      if (!passed) return false

      let idx = 0
      for (const syntaxToken of tokens) {
        const [type, posStart, posEnd, contents, tag] = syntaxToken
        if (type === 'nest') inlineTokenize(state, posStart, posEnd)
        else if (type === 'text') state.push('text', '', 0).content = contents
        else if (opts?.parse && type in opts.parse)
          opts.parse[type].bind(md)(state, name + '_' + type, contents, idx, tokens)
        else if (tag) {
          const [tagType, nesting] = chainTag(tag)
          state.push(name + '_' + type, tagType, nesting)
            .markup = contents
        }
        idx++
      }

      state.pos = parseEnd
      return true
    })
  }
  return { parse, plugin, types }
}

function syntaxSymbol(opts: { symb: string, tag?: string, render?: (contents: string) => string }) {
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

function syntaxBrackets(opts: { symb: [string, string], tag?: string, render?: (contents: string) => string }) {
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
        state.push(type, opts.tag as string, 1)
        inlineTokenize(state, posStart, pos)
        state.push(type, opts.tag as string, -1)
      }
      state.pos = pos + lenRight
      return true
    })
    if (opts.render) md.renderer.rules[type] = (tokens, idx) => (opts.render as any)(tokens[idx].markup)
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