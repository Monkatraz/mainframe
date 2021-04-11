import { markdown } from '@codemirror/lang-markdown'
import { parser as CSSAttrParser } from './grammars/css-attribute'
import { cssLanguage, cssCompletion } from '@codemirror/lang-css'
import {
  MarkdownConfig,
  Subscript, Superscript, Table, TaskList, Emoji,
  InlineParser, InlineContext, BlockContext, Line, Element
} from 'lezer-markdown'
import { styleTags, Tag, tags as t } from '@codemirror/highlight'
import { languages as languagesData } from '@codemirror/language-data'
import {
  LanguageDescription, LanguageSupport, LezerLanguage,
  continuedIndent, indentNodeProp
} from '@codemirror/language'
import { NodeProp, stringInput, Tree, TreeBuffer } from 'lezer-tree'
import { TarnationLanguage } from 'cm-tarnation'
// import { createMonarchLanguage } from 'cm6-monarch'
import type { Parser, ParserConfig } from 'lezer'
import type { Extension } from '@codemirror/state'

// -- MARKDOWN

export const mfmarkdown = () => markdown({
  codeLanguages: languages,
  extensions: extensions()
})

const extensions = (): MarkdownConfig[] => [
  Table, TaskList, Superscript, Subscript, Emoji,

  line('//', 'LineComment', { all: t.lineComment, consume: true, interrupt: true }),
  delim(['/*', '*/'], 'InlineBlockComment', { all: t.blockComment, consume: true, flanking: false }),

  delim('@@', 'Escape', { consume: true }),

  fence('$$$', 'TeXBlock', {
    // render(_, offset, contents) {
    //   return parseNested(TexGrammar.description, offset, contents)
    // }
  }),
  delim('$', 'TeXInline', {
    consume: true
    // render(_, offset, contents) {
    //   return parseNested(TexGrammar.description, offset, contents)
    // }
  }),

  delim(['{++', '++}'], 'CriticAddition',  { all: t.inserted, flanking: false }),
  delim(['{--', '--}'], 'CriticDeletion',  { all: t.deleted, flanking: false }),
  delim(['{==', '==}'], 'CriticHighlight', { all: t.special(t.meta), flanking: false }),
  delim(['{>>', '<<}'], 'CriticComment',   { all: t.special(t.comment), flanking: false }),
  chain({ name: 'CriticSubstitution', predicate: '{~~',
    chain: [
      [/\{~~/, '@mark'],
      [/.*?/, '@wrap Delete'],
      [/~>/,  'Arrow'],
      [/.*?/, '@wrap Insert'],
      [/~~\}/, '@mark']
    ],
    tags: {
      '@mark': t.changed,
      'Delete': t.deleted,
      'Arrow': t.changed,
      'Insert': t.inserted
    }
  }),

  delim('__', 'Underline', t.special(t.emphasis)),
  delim('/',  'Italics',   t.emphasis),
  delim('_',  'Emphasis',  t.emphasis),
  delim('**', 'Strong',    t.strong),
  delim('*',  'Bold',      t.strong),
  delim('--', 'Strikethrough', { tag: t.special(t.deleted),  flanking: true }),
  delim('==', 'Mark',          { tag: t.special(t.inserted), flanking: true }),

  chain({ name: 'InlineSpan', predicate: '#', endWith: '|#',
    chain: [
      [/#/, '@mark'],
      [/\w+/, 'Type'],
      [/\s+/],
      [/[^#|]*?/, { sub: { type: 'Parameter', match: /\S+/g } }],
      [/\|\s*/, '@mark']
    ],
    tags: {
      Type: t.keyword,
      Parameter: t.string
    }
   }),

  chain({ name: 'InlineCodeLang', predicate: '`', before: 'InlineCode',
    chain: [
      [/`+/, '@mark'],
      [/\w+/, 'Lang'],
      [/\s*\|\s*/, '@mark'],
      [/.*?/, 'Code'],
      [/`+/, '@mark']
    ],
    tags: {
      Lang: t.labelName
    },
    render: {
      Code(_, offset, contents, tokens) {
        const lang = tokens[1].text ? LanguageDescription.matchLanguageName(languages, tokens[1].text) : null
        return lang ? parseNested(lang, offset, contents) : []
      }
    }
   }),

  {
    props: [genStyles()],
    remove: ['Emphasis', 'IndentedCode']
  }
]

// -- MISC. GRAMMARS

interface LangDefinition {
  name: string
  parser: Parser
  configure?: ParserConfig
  alias?: string[]
  ext?: string[]
  languageData?: Record<string, any>
  extensions?: Extension[]
}

export function createLang(opts: LangDefinition) {
  const langDesc = Object.assign(
    { name: opts.name },
    opts.alias ? { alias: opts.alias } : {},
    opts.ext ? { extensions: opts.ext } : {}
  )
  const langData = { ...langDesc, ...(opts.languageData ?? {}) }

  const load = function () {
    const lang = LezerLanguage.define({ parser: opts.parser.configure(opts.configure ?? {}), languageData: langData })
    return new LanguageSupport(lang, opts.extensions)
  }

  const description = LanguageDescription.of({ ...langDesc, load: async () => load() })

  return { load, description }

}

export const LezerTreeGrammar = new TarnationLanguage({
  name: 'LezerTree',
  grammar: {
    fallback: ['t.string'],
    brackets: [
      { name: 't.bracket', pair: ['[', ']'] }
    ],
    states: {
      root: [
        [/[\u251C\u2514\u2502\u2500]/, 't.punctuation'],
        [/'.+'$/, 't.string'],
        [/(\S*?\s)(\[)(\d+)(\.\.)(\d+)(\])(:?)/,
          ['t.content', '@BR', 't.integer', 't.operator', 't.integer', '@BR', 't.separator']
        ],
        [/(\S*?\s)(\d+)/, ['t.content', 't.integer']]
      ]
    }
  }
})

export const FTMLTokensGrammar = new TarnationLanguage({
  name: 'FTMLTokens',
  grammar: {
    fallback: ['t.string'],
    brackets: [
      { name: 't.bracket', pair: ['[', ']'] }
    ],
    states: {
      root: [
        [/^(\[)(\d+)( <-> )(\d+)(\])(:)(\s*)(\S+)(\s*)(=>)(.*$)/,
          [
            '@BR', 't.integer', 't.operator', 't.integer', '@BR', 't.separator', '',
            't.content', '', 't.operator', 't.string'
          ]
        ]
      ]
    }
  }
})

// export const LezerTreeGrammar = createMonarchLanguage({
//   name: 'LezerTree',
//   lexer: {
//     defaultToken: 'string',
//     unicode: true,
//     tokenizer: {
//       root: [
//         [/[\u251C\u2514\u2502\u2500]/, 'punctuation'],
//         [/'.+'$/, 'string'],
//         [/(\S*?\s)(\[)(\d+)(\.\.)(\d+)(\]:?)/, [
//           'content', 'squareBracket', 'integer', 'operator', 'integer', 'squareBracket'
//         ]],
//         [/(\S*?\s)(\d+)/, ['content', 'integer']]
//       ]
//     }
//   }
// })

// export const TexGrammar = createMonarchLanguage({
//   name: 'wikimath',
//   lexer: {
//     defaultToken: 'unit',
//     texBrackets: ['(', ')', '[', ']', '{', '}'],
//     texSymbols: [
//       '+', '-', '=', '!', '/', '<', '>', '|', "'", ':', '*'
//     ],
//     tokenizer: {
//       root: [
//         [/%.*$/, 'comment'], // %comments

//         // begin{}, end{}
//         [/(\\(?:begin|end))(\{)(.*?)(\})/, [
//           'string',
//           'brace',
//           { cases: {
//             '\\w+\\s[^}]*': 'string',
//             '@default': 'keyword'
//           } },
//           'brace'
//         ]],

//         [/([a-zA-Z]+)(?=\(.*?\))/, 'name'], // styles 'fn()'
//         [/\\#?[a-zA-Z0-9]+/, 'string'],     // commands
//         [/\\[,>;!]/, 'string'],             // spacing
//         [/\\+/, 'escape'],                  // \\ and the like
//         [/[\^_&]/, 'keyword'],              // special keywords/operators

//         // symbols, non word/digit characters
//         [/\W/, { cases: {
//           '@texSymbols': 'operator',
//           '@texBrackets': 'bracket',
//           '@default': 'emphasis'
//         } }],

//         // words/digit characters
//         [/\w/, { cases: {
//           '[0-9]': 'unit',
//           '@default': 'emphasis'
//         } }]
//       ]
//     }
//   }
// })

export const CSSAttributeGrammar = createLang({
  name: 'CSS-Attribute',
  parser: CSSAttrParser,
  languageData: {
    ...(cssLanguage.data as any).default[0],
    ...(cssCompletion as any).value
  },
  configure: {
    props: [
      indentNodeProp.add({
        Declaration: continuedIndent()
      }),
      styleTags({
        'PropertyName': t.propertyName,
        'NumberLiteral': t.number,
        'callee': t.keyword,
        'CallTag ValueName': t.atom,
        'Callee': t.variableName,
        'Unit': t.unit,
        'BinOp': t.arithmeticOperator,
        'Important': t.modifier,
        'Comment': t.blockComment,
        'ParenthesizedContent': t.special(t.name),
        'ColorLiteral': t.color,
        'StringLiteral': t.string,
        ':': t.punctuation,
        'PseudoOp #': t.derefOperator,
        '; ,': t.separator,
        '( )': t.paren,
        '[ ]': t.squareBracket,
        '{ }': t.brace
      })
    ]
  }
})

export const languages = [
  ...languagesData,
  LezerTreeGrammar.description,
  FTMLTokensGrammar.description,
  // TexGrammar.description,
  CSSAttributeGrammar.description
]

// -- UTIL

const marks = [
  'Subscript',
  'Superscript',
  'Header',
  'Quote',
  'List',
  'Link',
  'Emphasis',
  'Code'
]

const styles: Record<string, Tag> = {}

const genStyles = () => styleTags({
  // Comments
  'Comment':            t.comment,
  'CommentBlock':       t.blockComment,

  // Line Elements
  'HorizontalRule':     t.contentSeparator,

  // Blocks
  'Blockquote/...':     t.quote,
  'BlockQuote/...':     t.quote,
  'OrderedList/...':    t.list,
  'BulletList/...':     t.list,

  // Headings
  'ATXHeading/...':     t.strong,
  'HeaderMark':         t.heading,
  'SetextHeading/...':  t.heading,
  'TableHeader/...':    t.heading,

  // Inline Content (between generic delimiters)
  'Emphasis/...':       t.emphasis,
  'StrongEmphasis/...': t.strong,
  'Subscript':          t.special(t.content),
  'Superscript':        t.special(t.content),
  'InlineCode':         t.monospace,

  // [] type syntax, e.g. ![] for images
  'URL':                t.url,
  'Image/...':          t.link,
  'Link/...':           t.link,
  'LinkLabel':          t.labelName,
  'LinkTitle':          t.string,

  // Misc.
  'TaskMarker':         t.atom,
  'Emoji':              t.character,
  'Escape':             t.escape,
  'Entity':             t.character,
  'CodeInfo':           t.labelName,
  'HardBreak':          t.processingInstruction,
  'TableDelimiter':     t.processingInstruction,

  // Giant string of various markers
  [marks.map(mark => mark + 'Mark').join(' ')]: t.processingInstruction,

  // Merge any custom syntax we added
  ...styles
})

const PUNCT_REGEX = /[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~\xA1\u2010-\u2027]/
const SPACE_REGEX = /\s|^$/

/** Converts a string into a list of numbers representing character code points. */
function toPoints(str: string) {
  const codes: number[] = []
  for (const ch of str) codes.push(ch.codePointAt(0)!)
  return codes
}

/** Checks if given chunk of text (`pos + len`) matches CommonMark flanking rules. */
function isFlanking(cx: InlineContext, pos: number, len: number, strict: boolean) {
  const
    prev = pos > cx.offset ? String.fromCharCode(cx.char(pos - 1)) : ' ',
    next = pos + len < cx.end ? String.fromCharCode(cx.char(pos + len)) : ' ',
    pPrev = PUNCT_REGEX.test(prev),
    pNext = PUNCT_REGEX.test(next),
    wPrev = SPACE_REGEX.test(prev),
    wNext = SPACE_REGEX.test(next)

  let left = true, right = true

  if (wNext) left = false
  if (wPrev) right = false
  if (strict) {
    if (pNext && !wPrev) left = false
    if (pPrev && !wNext) right = false
    if (!pPrev && !wPrev && !pNext && !wNext) {
      left = false, right = false
    }
  }

  return { left, right }
}

interface StyleOpts {
  /** Determines which tag will be associated with this syntax. */
  tag?: Tag,
  /** Determines which tag will be associated with the markers of this syntax. */
  mark?: Tag,
  /** Determines which tag will be associated with both the markers and the syntax itself. */
  all?: Tag
}

/** Adds the given name to the `styles` table, and automatically handles the `Mark` variant of the name. */
function addStyles(tagName: string, opts?: StyleOpts | Tag) {
  const name = tagName + '/...'
  const mark = name + 'Mark'
  if (opts && !(opts instanceof Tag)) {
    const { tag, mark: tagMark, all } = opts
    if (all) {
      styles[name] = all
      styles[mark] = all
    } else {
      if (tag) styles[name] = tag
      if (tagMark) styles[mark] = tagMark
      else marks.push(tagName)
    }
  } else {
    if (opts && opts instanceof Tag) styles[name] = opts
    marks.push(tagName)
  }
}

/** Checks whether or not the given list of character codes can be found in the
 *  `Line`/`InlineContext` at the given position. */
function matches(points: number[], pos: number, cx: InlineContext | Line) {
  if (cx instanceof InlineContext)
    return points.every((ch, idx) => cx.char(pos + idx) === ch)
  else if (cx instanceof Line)
    return points.every((ch, idx) => cx.text.codePointAt(pos + idx) === ch)
  else return false
}

// -- NAUGHTY PRIVATE API HACKERY

/** Satisfies (mostly) the interface of `Element` but takes in a `Tree` or `TreeBuffer` node instead of a type.
 *  Taken from the `lezer-markdown` source. */
class TreeElement implements Element {
  type!: number // just to make typescript happy :)
  constructor(readonly tree: Tree | TreeBuffer, readonly from: number) {}
  get to() { return this.from + this.tree.length }
  writeTo(buf: any, offset: number) {
    buf.nodes.push(this.tree)
    buf.content.push(buf.nodes.length - 1, this.from + offset, this.to + offset, -1)
  }
  toTree() { return this.tree }
}

/** Sync. parses the text given and returns a list of `TreeElements`.
 *  The language provided must be in the format of a `LanguageDescription`.
 *  If the language has not been loaded, it will be async. loaded for later usage.
 *  Taken from the `lezer-markdown` source's `HTMLTag` syntax. */
function parseNested(lang: LanguageDescription, offset: number, text: string): Element[] {
  if (!lang.support) { lang.load(); return [] }
  const parse = lang.support.language.parser.startParse(stringInput(text), 0, {})
  let tree: Tree | null = null
  while (!(tree = parse.advance())) {}
  return tree.children.map((ch, i) => new TreeElement(ch, offset + tree!.positions[i]))
}

// -- SYNTAX EXTENSIONS

// -- SYNTAX GENERATORS

/** A chain rule can take three forms:
 *  - `[/regex/]`
 *      - Requires that the chain matches this text, but gives it no particular type.
 *  - `[/regex/, 'type']`
 *      - Maps the matched text to the given type.
 *  - `[/regex/, opts?: { type?, sub? }]`
 *      - Maps the matched text to (optionally) a type, and handles 'sub' matching.
 *
 *  A 'sub' matcher will take in the matched text and repeatedly match tokens inside of it.
 *  It must be given both a global `match` regex, and a `type`. This can be used for repeated lists of tokens,
 *  like an argument list inside of a function. */
type ChainRule =
  [match: RegExp, type?: string] |
  [match: RegExp, opts: { type?: string, sub?: ChainSub }]

type ChainSub = { type: string, match: RegExp }

interface ChainIR {
  regex: RegExp
  groups: { type: string, sub?: ChainSub }[]
}

interface ChainToken {
  type: string
  text: string
  start: number
  end: number
}

function chainAddType(type: string, types: Set<string>) {
  if (!type) return
  if (type.startsWith('@')) {
    const wrap = type.split(/\s+/)[1]
    if (wrap) types.add(wrap)
  }
  else types.add(type)
}

function chainCompile(chain: ChainRule[]) {
  const types: Set<string> = new Set()
  const chainIR: ChainIR = { regex: RegExp(''), groups: [] }
  let regex = ''
  for (const rule of chain) {
    regex += `(${rule[0].source})`
    if (rule[1] && typeof rule[1] !== 'string') {
      const { type = '', sub } = rule[1]
      chainIR.groups.push({ type, sub })
      if (type) chainAddType(type, types)
      if (sub) chainAddType(sub.type, types)
    } else {
      const type = rule[1] ?? ''
      chainIR.groups.push({ type })
      if (type) chainAddType(type, types)
    }
  }
  chainIR.regex = RegExp(regex)

  const parse = (src: string) => {
    const match = chainIR.regex.exec(src)
    const tokens: ChainToken[] = []
    if (!match || match.index !== 0) return false
    const len = match.shift()?.length ?? 0 // removes the 'total result'
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
        type: group.type, text, start: start, end: pos
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
            type: group.sub.type, text: submatch[0], start: substart, end: pos
          })
        }
      }
    }
    return { tokens, len }
  }

  return { parse, types }
}

interface ChainOpts {
  /** Base name of the syntax. */
  name: string
  /** A list of successive rules that identify and match tokens of the syntax. */
  chain: ChainRule[],
  /** A symbol that is inexpensively checked prior to doing anything else.
   *  This determines whether or not the more expensive chain parser should be ran. */
  predicate?: string
  /** If provided, the chain syntax becomes the starting delimiter of a delimiter pair.
   *  The provided string becomes the ending symbol of the delimiter pair. */
  endWith?: string
  /** Defaults to 'Emphasis'. Inserts this syntax before the given one, causing it to be checked first. */
  before?: string
  /** A mapping of chain types to tags. */
  tags?: Record<string, Tag>
  /** A mapping of chain types to `Element` returning render functions. */
  render?: Record<string, (cx: InlineContext, offset: number, contents: string, tokens: ChainToken[]) => Element[]>
}

/** Returns a `MarkdownConfig` extension that matches an inline chunk of text to a list of matcher rules. */
function chain({ name, chain, predicate, endWith, before = 'Emphasis', tags, render }: ChainOpts): MarkdownConfig {

  const mark = name + 'Mark'
  const pred = predicate ? toPoints(predicate) : null
  const delimiter = endWith ? { resolve: name, mark } : null
  const endChars = endWith ? toPoints(endWith) : []
  const { parse: chainParse, types } = chainCompile(chain)

  if (tags) for (const type in tags) {
    if (type === '@mark') styles[mark] = tags[type]
    else styles[name + type] = tags[type]
  }

  if (!tags || !('@mark' in tags)) marks.push(name)

  const parse: InlineParser['parse'] = (cx, _, pos) => {
    // handle `endWith` symbol first
    if (delimiter && matches(endChars, pos, cx))
      return cx.addDelimiter(delimiter, pos, pos + endChars.length, false, true)

    if (pred && !matches(pred, pos, cx)) return -1

    const text = cx.slice(pos, cx.end)
    const result = chainParse(text)
    if (!result) return -1

    const { tokens, len } = result
    const children: Element[] = []
    for (const { text, type, start: localStart, end: localEnd } of tokens) {
      const start = pos + localStart, end = pos + localEnd
      // @mark special type, which is a shorthand for a generic marker type
      if (type === '@mark') children.push(cx.elt(mark, start, end))
      // @wrap special type, which 'nests' inline-parsed elements
      // giving '@wrap foo' wraps the elements in a 'foo' node
      else if (type.startsWith('@wrap')) {
        const nest = cx.parser.parseInline(text, start)
        if (type === '@wrap') children.push(...nest)
        else {
          const wrap = type.split(/\s+/)[1]
          if (wrap) children.push(cx.elt(name + wrap, start, end, nest))
          else children.push(...nest)
        }
      }
      // non-special types
      else if (type) {
        const nested = render && type in render ? render[type](cx, start, text, tokens) : []
        children.push(cx.elt(name + type, start, end, nested))
      }
    }

    if (!delimiter) return cx.addElement(cx.elt(name, pos, pos + len, children))
    else {
      cx.addDelimiter(delimiter, pos, pos, true, false)
      children.forEach(elem => cx.addElement(elem))
      return pos + len
    }
  }

  return {
    defineNodes: [name, mark, ...Array.from(types).map(type => name + type)],
    parseInline: [{ name, parse, before }]
  }
}

interface LineOpts extends StyleOpts {
  /** Whether or not this syntax can interrupt certain blocks, such as paragraphs,
   *  without requiring a blank new line. */
  interrupt?: boolean
  /** Whether or not this syntax entirely 'consumes' all characters matched by it.
   *  If false, which is the default, the matched characters will be inline-parsed. */
  consume?: boolean
}

/** Returns `MarkdownConfig` extension that adds a syntax matching 'line-start' syntax, like JS `//` comments.
 *  @example const ext = line('//' 'LineComment', t.lineComment) */
function line(str: string, name: string, opts?: LineOpts | Tag): MarkdownConfig {

  const { interrupt = false, consume = false } = opts && !(opts instanceof Tag) ? opts : {}

  const mark = name + 'Mark'
  addStyles(name, opts)

  const chars = toPoints(str)

  const parse = (cx: BlockContext, line: Line) => {
    if (matches(chars, line.pos, line)) {
      const pos = line.pos
      const start = cx.lineStart + pos
      const len = chars.length
      const offset = start + len

      // starting marker (e.g. '//' in a line comment)
      const children = [cx.elt(mark, start, offset)]
      if (!consume) children.push(...cx.parser.parseInline(line.text.slice(pos + len), offset))
      cx.nextLine()
      cx.addElement(cx.elt(name, start, cx.prevLineEnd(), children))
      return true
    }
    return false
  }

  return {
    defineNodes: [{ name, block: true }, mark],
    parseBlock: [{
      name,
      parse,
      endLeaf: !interrupt ? undefined : (_, line) => matches(chars, line.pos, line),
      before: 'Blockquote'
    }]
  }
}

interface FenceOpts extends StyleOpts {
  /** Whether or not this syntax can interrupt certain blocks, such as paragraphs,
   *  without requiring a blank new line. */
  interrupt?: boolean
  /** A function which must return a list of `Element`s, given the content of the fenced block. */
  render?: (cx: BlockContext, offset: number, contents: string, info: string) => Element[]
}

/** Returns a `MarkdownConfig` extension that adds a syntax delimiting fenced blocks of text.
 *  @example const ext = fence('$$$', 'MathBlock', t.monospace) */
function fence(str: string | [string, string], name: string, opts?: FenceOpts | Tag): MarkdownConfig {

  const { interrupt = false, render = null } = opts && !(opts instanceof Tag) ? opts : {}

  const mark = name + 'Mark'
  addStyles(name, opts)

  const paired = typeof str !== 'string'
  const chars: [number[], number[]] = paired ?
    [toPoints(str[0]), toPoints(str[1])] :
    [toPoints(str as string), toPoints(str as string)]
  const len = [chars[0].length, chars[1].length]

  const parse = (cx: BlockContext, line: Line) => {
    if (!matches(chars[0], line.pos, line)) return false
    const pos = line.pos
    const start = cx.lineStart + pos
    const offset = start + len[0]

    const info = line.text.slice(pos + len[0])

    if (!cx.nextLine()) return false

    const children = [
      cx.elt(mark, start, offset),
      cx.elt('FenceInfo', offset, cx.prevLineEnd())
    ]
    const textStart = cx.lineStart
    const text: string[] = []

    let foundEnd = false

    do {
      foundEnd = matches(chars[1], line.pos, line)
      if (foundEnd) break
      else text.push(line.text)
    } while (cx.nextLine())

    if (render) children.push(...render(cx, textStart, text.join('\n'), info))

    if (foundEnd) {
      const start = cx.lineStart + line.pos
      const offset = start + len[1]
      children.push(cx.elt(mark, start, offset))
      cx.nextLine()
    }

    cx.addElement(cx.elt(name, start, cx.prevLineEnd(), children))
    return true
  }

  return {
    defineNodes: [{ name, block: true }, mark, 'FenceInfo'],
    props: [
      NodeProp.openedBy.add({ [mark]: [mark] }),
      NodeProp.closedBy.add({ [mark]: [mark] }),
      styleTags({
        FenceInfo: t.labelName
      })
    ],
    parseBlock: [{
      name,
      parse,
      endLeaf: !interrupt ? undefined : (_, line) => matches(chars[0], line.pos, line),
      before: 'Blockquote'
    }]
  }
}

interface DelimOpts extends StyleOpts {
  /** Determines how 'flanking' rules should be handled.
   *  - If false, the delimiters can be placed anywhere in a line.
   *  - If true, the delimiters cannot be standing 'alone' in whitespace, e.g. `** not valid **`.
   *  - If 'strict', the delimiters must fully match CommonMark flanking rules. */
  flanking?: boolean | 'strict'
  /** Whether or not this syntax entirely 'consumes' all characters matched by it.
   *  If false, which is the default, the matched characters will be inline-parsed. */
  consume?: boolean
  /** A function which must return a list of `Element`s, given the contents of the matched text.
   *  Requires `consume` to be true to work. */
  render?: (cx: InlineContext, offset: number, contents: string) => Element[]
}

/** Returns a `MarkdownConfig` extension that adds a syntax that matches
 *  inline text found between a pair of delimiters.
 * @example const ext = delim('*', 'EmphasisStrong', t.strong) */
function delim(str: string | [string, string], name: string, opts?: DelimOpts | Tag): MarkdownConfig {

  const { flanking = 'strict', consume = false, render = null } = opts && !(opts instanceof Tag) ? opts : {}

  const mark = name + 'Mark'
  const delimiter = { resolve: name, mark }
  addStyles(name, opts)

  const paired = typeof str !== 'string'
  const chars: [number[], number[]] = paired ?
    [toPoints(str[0]), toPoints(str[1])] :
    [toPoints(str as string), toPoints(str as string)]
  const len = [chars[0].length, chars[1].length]

  const parse: InlineParser['parse'] = (cx, _, pos) => {
    let open = matches(chars[0], pos, cx)
    let close = !paired ? open : matches(chars[1], pos, cx)
    if (!open && !close) return -1
    const idx = open ? 0 : 1

    if (flanking) {
      const { left, right } = isFlanking(cx, pos, len[idx], flanking === 'strict')
      if (paired) {
        if ((!left && !right) || (open && !left) || (close && !right)) return -1
        open = left && open, close = right && close
      } else {
        open = left, close = right
      }
    }

    if (consume && close) {
      const idx = cx.findOpeningDelimiter(delimiter)
      if (idx !== null) {
        const start = (cx as any).parts[idx].from
        cx.takeContent(idx)
        const children = [
          cx.elt(mark, start, start + len[0]),
          ...(render ? render(cx, start + len[0], cx.slice(start + len[0], pos)) : []),
          cx.elt(mark, pos, pos + len[1])
        ]
        return cx.addElement(cx.elt(name, start, pos + len[1], children))
      }
      else if (!open) return -1
    }

    return cx.addDelimiter(delimiter, pos, pos + len[idx], open, close)
  }

  return {
    defineNodes: [name, mark],
    props: [
      NodeProp.openedBy.add({ [mark]: [mark] }),
      NodeProp.closedBy.add({ [mark]: [mark] })
    ],
    parseInline: [{ name, parse, before: 'Emphasis' }]
  }
}
