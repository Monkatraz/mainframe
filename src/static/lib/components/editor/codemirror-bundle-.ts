/* eslint-disable quote-props */
import { EditorState, Extension, tagExtension } from '@codemirror/state'
import {
  EditorView, ViewPlugin, ViewUpdate, drawSelection,
  highlightActiveLine, highlightSpecialChars, keymap, Decoration, DecorationSet
} from '@codemirror/view'
import { history, historyKeymap } from '@codemirror/history'
import { foldGutter, foldKeymap } from '@codemirror/fold'
import { indentOnInput, LanguageDescription } from '@codemirror/language'
import { lineNumbers } from '@codemirror/gutter'
import { defaultKeymap, defaultTabBinding } from '@codemirror/commands'
import { bracketMatching } from '@codemirror/matchbrackets'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { commentKeymap } from '@codemirror/comment'
import { rectangularSelection } from '@codemirror/rectangular-selection'
import { HighlightStyle, tags as t } from '@codemirror/highlight'
import { RangeSetBuilder } from '@codemirror/rangeset'
import type { Line } from '@codemirror/text'
import { redo } from '@codemirror/history'
import { copyLineDown } from '@codemirror/commands'
import { foldNodeProp } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { createMonarchLanguage } from 'cm6-monarch'

// -- RE-EXPORTS

export { EditorState, tagExtension }
export type { Extension }
export { EditorView, ViewPlugin, ViewUpdate }
export { LanguageDescription }
export { languages }

// -- GUTTERS EXTENSION

const hideGuttersTheme = EditorView.theme({
  '$.hide-gutters $gutters': {
    display: 'none !important'
  },
  '$.hide-gutters $content': {
    paddingLeft: '0.5rem'
  }
})

// -- INDENTHACK EXTENSION

const WHITESPACE_REGEX = /^\s+/

function indentDeco(view: EditorView) {
  // get every line of the visible ranges
  const lines = new Set<Line>()
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      let line = view.state.doc.lineAt(pos)
      lines.add(line)
      pos = line.to + 1
    }
  }

  // get the indentation of every line
  // and create an offset hack decoration if it has any
  const tabInSpaces = ' '.repeat(view.state.facet(EditorState.tabSize))
  const builder = new RangeSetBuilder<Decoration>()
  for (const line of lines) {
    // there is almost certainly a much better way to do this
    const WS = WHITESPACE_REGEX.exec(line.text)?.[0]
    const col = WS?.replaceAll('\t', tabInSpaces).length
    if (col) builder.add(line.from, line.from, Decoration.line({
      attributes: { style: `padding-left: ${col}ch; text-indent: -${col}ch` }
    }))
  }

  return builder.finish()
}

const indentHack = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = indentDeco(view)
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged)
        this.decorations = indentDeco(update.view)
    }
  },
  { decorations: v => v.decorations }
)

// -- MONARCH MARKDOWN LANGUAGE

// TODO: color decorators for #color col|
// TODO: accept replacement / deletion / addition actions

const open = (name: string) =>
  ({ token: '@rematch', next: '@' + name, parser: { open: name[0].toUpperCase() + name.substr(1) } })

const close = (name: string) =>
  ({ token: '@rematch', next: '@pop', parser: { close: name[0].toUpperCase() + name.substr(1) } })

const monarchMarkdown = createMonarchLanguage({
  name: 'markdown',
  nestLanguages: languages,
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } }
  },
  configure: {
    props: [
      foldNodeProp.add({
        Container: (tree, state) =>
          ({ from: Math.min(tree.from + 20, state.doc.lineAt(tree.from).to), to: tree.to - 1 }),
        Table: (tree, state) =>
          ({ from: state.doc.lineAt(tree.from).to, to: tree.to - 1 }),
        CodeBlock: (tree, state) =>
          ({ from: state.doc.lineAt(tree.from).to, to: tree.to }),
        HeadingSection: (tree, state) =>
          ({ from: state.doc.lineAt(tree.from).to, to: tree.to - 2 }),
        BlockComment: tree =>
          ({ from: tree.from, to: tree.to })
      })
    ]
  },
  lexer: {
    defaultToken: 'content',

    // control characters, aka anything used to signify something
    control: /[\\|:><`@~*=^$_[\]{}()#+\-.!/]/,
    noncontrol: /[^\\|:><`@~*=^$_[\]{}()#+\-.!/]/,

    // matches escaped control characters
    escapes: /\\@control/,

    // shorthands
    blocks: /#+\s|[-+*]\s|\d+(?:\.|\))|>|\$\$\$|```|\|/,
    containers: />+\s|[-+*]\s|\d+(?:\.|\))/,
    s: /^\s*/, // starting whitespace
    enl: /^\s*$/, // empty new line

    // TeX
    latexBrackets: ['(', ')', '[', ']', '{', '}'],
    latexSymbols: [
      '+', '-', '=', '!', '/', '<', '>', '|', "'", ':', '*'
    ],

    tokenizer: {
      // block level elements
      root: [

        { include: '@comments' },

        // Horizontal Rules
        [/@s(-|\*)(?:\s*?\1){2,}\s*$/, 'contentSeparator'],

        // Headers (block-level)
        [/@s(#+)\s+(?!$)/, { token: 'heading', parser: { open: 'HeadingSection', close: 'HeadingSection' } }],
        [/(?<=@s#+\s+.+\s*)(#+)\s*$/, 'heading'], // ending hashes on headers
        [/@s(=|-)\1{2,}\s*$/, 'heading'], // ===== / ----- headings

        // Code Blocks
        [
          /@s(```\s*)([\w/\-#]+$)/,
          [
            'punctuation',
            { token: 'string', next: '@code_lang', nextEmbedded: '$2', parser: { start: 'CodeBlock' } }
          ]
        ],
        // no code block language specified
        [/```\s*$/, { token: 'punctuation', next: '@code_nolang', parser: { start: 'CodeBlock' } }],

        // TeX Block
        [/@s\$\$\$\s*$/, { token: 'punctuation', next: '@math_block', parser: { start: 'CodeBlock' } }],

        // Tables
        [/@s\|/, open('table')],

        // Containers (list items, blockquotes, etc.)
        [/@s(?:@containers\s*)+/, open('container')],

        // Generic Paragraphs
        [/@s(?!@blocks)[^\s]/, open('paragraph')]

      ],
      // inline level elements
      inline: [

        { include: '@comments' },

        // escaped content
        [/@@[^]*?@@/, 'escape'],
        [/&\w+;/, 'escape'],
        [/@escapes/, 'escape'],

        // inline code
        [/(`)((?:\w|[/\-#])+)(\|)/, [
          'punctuation',
          'string',
          { token: 'punctuation', next: '@code_inline', nextEmbedded: '$2' }
        ]],

        // monospace
        [/(`+)((?:(?!\1)[^]|@escapes)+)(\1)/, ['punctuation', 'monospace', 'punctuation']],

        // inline math
        [/\B\$(?=([^$]|@escapes))/, 'punctuation', '@math_inline'],

        // auto-detect links (huge frickin' regex)
        // https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
        [/(http(s)?:\/\/.)?(www\.)?[-\w@:%.+~#=]{2,256}\.[a-z]{2,6}\b([-\w@:%+.~#?&//=]*)/,
          'link'],

        // inline element
        [/(#)(\w+\s*)([^#|]*?)(\|)/,
          ['punctuation', 'keyword', 'string', 'punctuation']],
        [/\|#/, 'punctuation'],

        // buncha markup

        [/(?:(?<=[^\s])(\/|\*\*?|==|--)\B)|(?:\B(\/|\*\*?|==|--)(?=(?!\2)[^\s]|@escapes))/, {
          cases: {
            '$1~\\*\\*?': { token: 'punctuation', parser: { close: 'strong' } },
            '$2~\\*\\*?': { token: 'punctuation', parser: { open: 'strong' } },
            '$1~/': { token: 'punctuation', parser: { close: 'emphasis' } },
            '$2~/': { token: 'punctuation', parser: { open: 'emphasis' } },
            '$1~--': { token: 'punctuation', parser: { close: 'strikethrough' } },
            '$2~--': { token: 'punctuation', parser: { open: 'strikethrough' } },
            '$1~==': { token: 'punctuation', parser: { close: 'mark' } },
            '$2~==': { token: 'punctuation', parser: { open: 'mark' } }
          }
        }],

        [/(?:(?<=[^\s])(__|_)\b)|(?:\b(__|_)(?=(?!\2)[^\s]|@escapes))/, {
          cases: {
            '$1~__': { token: 'punctuation', parser: { close: 'underline' } },
            '$2~__': { token: 'punctuation', parser: { open: 'underline' } },
            '$1~_': { token: 'punctuation', parser: { close: 'emphasis' } },
            '$2~_': { token: 'punctuation', parser: { open: 'emphasis' } }
          }
        }],

        [/(?:(?<=[^\s])(~|\^))|(?:(~|\^)(?=(?!\2)[^\s]|@escapes))/, {
          cases: {
            '$1~~': { token: 'punctuation', parser: { close: 'subscript' } },
            '$2~~': { token: 'punctuation', parser: { open: 'subscript' } },
            '$1~\\^': { token: 'punctuation', parser: { close: 'superscript' } },
            '$2~\\^': { token: 'punctuation', parser: { open: 'superscript' } }
          }
        }],

        // -- critic markup

        [/({\+\+)((?:(?!\+\+})[^]|@escapes)+)(\+\+})/, 'inserted'],
        [/({--)((?:(?!--})[^]|@escapes)+)(--})/, 'deleted'],
        [/({==)((?:(?!==})[^]|@escapes)+)(==})/, 'criticHighlight'],
        [/({>>)((?:(?!<<})[^]|@escapes)+)(<<})/, 'criticComment'],
        // substitution
        [/({~~)((?:(?!~~}|~>)[^]|@escapes)+)(~>)((?:(?!~~})[^]|@escapes)+)(~~})/,
          [
            'changed',
            'deleted',
            'changed',
            'inserted',
            'changed'
          ]
        ],

        // [], ![] images, links
        [/(!?\[)((?:[^\\]|@escapes)+)(\]\()([^)]+)(\))/, ['link', 'content', 'link', 'url', 'link']],
        [/(!?\[)((?:[^\\]|@escapes)+)(\])/, ['link', 'content', 'link']],

        // inline html
        [/<\/?\w+?.*?>/, '@rematch', '@tag'],

        // everything else
        [/@noncontrol+/, 'content']
      ],

      // comments
      comments: [
        [/@s\/\/.*$/, 'comment'],
        [/\/\*([^]+)\*\//, 'blockComment'],
        [/<!--([^]+)-->/, 'blockComment'],
        [/\/\*/, { token: 'blockComment', next: '@comment_block', parser: { open: 'BlockComment' } }],
        [/<!--/, { token: 'blockComment', next: '@comment_html', parser: { open: 'BlockComment' } }]
      ],
      comment_block: [
        [/\*\//, { token: 'blockComment', next: '@pop', parser: { close: 'BlockComment' } }],
        [/((?!\*\/)[^])+/, 'blockComment']
      ],
      comment_html: [
        [/-->/, { token: 'blockComment', next: '@pop', parser: { close: 'BlockComment' } }],
        [/((?!-->)[^])+/, 'blockComment']
      ],

      // HTML tags
      tag: [
        [/(<\/?)(\w+)/, ['bracket', 'typeName']],
        [
          /(\w+)(\s*=\s*)(["[^"]*"|'[^']*'|[^>"'\s]+)/,
          ['propertyName', 'operator', 'string']
        ],
        [/\w+/, 'propertyName'],
        [/\/?>/, 'bracket', '@pop']
      ],

      // blocks / containers
      table: [
        [/@s[^|]*$/, close('table')],
        [/(?<=\|\s*)((:-+:?)|(-+:))(?=\s*\|)/, 'operator'],
        [/\|/, 'separator'],
        { include: '@inline' }
      ],
      container: [
        [/@enl/, close('container')],
        [/@s(?:@containers\s*)+/, 'keyword'],
        { include: '@inline' }
      ],
      paragraph: [
        [/@enl/, close('paragraph')],
        [/@s(?:@blocks)/, close('paragraph')],
        { include: '@inline' }
      ],

      // embedded / code blocks
      code_lang: [
        [/@s```\s*$/, { token: 'punctuation', next: '@pop', nextEmbedded: '@pop', parser: { close: 'CodeBlock' } }],
        [/^.*$/, 'monospace']
      ],
      code_nolang: [
        [/@s```\s*$/, { token: 'punctuation', next: '@pop', parser: { close: 'CodeBlock' } }],
        [/^.*$/, 'monospace']
      ],
      code_inline: [
        [/`/, { token: 'punctuation', next: '@pop', nextEmbedded: '@pop' }],
        [/[^`]+/, 'monospace']
      ],

      // math / TeX
      math_block: [
        [/@s\$\$\$\s*$/, { token: 'punctuation', next: '@pop', parser: { end: 'CodeBlock' } }],
        { include: '@math' }
      ],
      math_inline: [
        [/\$\B/, 'punctuation', '@pop'],
        { include: '@math' }
      ],
      math: [
        // %comments
        [/%.*$/, 'comment'],
        // begin{}, end{}
        [/(\\(?:begin|end))({)(.*?)(})/, [
          'string',
          'brace',
          {
            cases: {
              '\\w+\\s[^}]*': 'string',
              '@default': 'keyword'
            }
          },
          'brace'
        ]],
        // styles 'fn()'
        [/([a-zA-Z]+)(?=\(.*?\))/, 'name'],
        // commands
        [/\\#?[a-zA-Z0-9]+/, 'string'],
        // spacing
        [/\\[,>;!]/, 'string'],
        // \\ and the like
        [/\\+/, 'escape'],
        // special keywords/operators
        [/[\^_&]/, 'keyword'],
        // symbols, non word/digit characters
        [/\W/, {
          cases: {
            '@latexSymbols': 'operator',
            '@latexBrackets': 'bracket',
            '@default': 'emphasis'
          }
        }],
        // words/digit characters
        [/\w/, {
          cases: {
            '[0-9]': 'unit',
            '@default': 'emphasis'
          }
        }]
      ]
    }
  }
})

// -- CONFINEMENT THEME

const
  background = 'var(--colcode-background)',
  hover      = 'var(--colcode-hover)'     ,
  border     = 'var(--colcode-border)'    ,
  accent     = 'var(--colcode-accent)'    ,
  selection  = 'var(--colcode-selection)' ,
  text       = 'var(--colcode-content)'   ,
  comment    = 'var(--colcode-comment)'   ,
  doc        = 'var(--colcode-commentdoc)',
  punct      = 'var(--colcode-punct)'     ,
  operator   = 'var(--colcode-operator)'  ,
  keyword    = 'var(--colcode-keyword)'   ,
  logical    = 'var(--colcode-logical)'   ,
  string     = 'var(--colcode-string)'    ,
  entity     = 'var(--colcode-entity)'    ,
  type       = 'var(--colcode-type)'      ,
  ident      = 'var(--colcode-ident)'     ,
  func       = 'var(--colcode-function)'  ,
  constant   = 'var(--colcode-constant)'  ,
  property   = 'var(--colcode-property)'  ,
  tag        = 'var(--colcode-tag)'       ,
  classes    = 'var(--colcode-class)'     ,
  attr       = 'var(--colcode-attribute)' ,
  link       = 'var(--colcode-link)'      ,
  invalid    = 'var(--colcode-invalid)'   ,
  inserted   = 'var(--colcode-inserted)'  ,
  changed    = 'var(--colcode-changed)'   ,
  important  = 'var(--colcode-important)' ,
  highlight  = 'var(--colcode-highlight)' ,
  note       = 'var(--colcode-note)'      ,
  special    = 'var(--colcode-special)'

const confinementTheme = EditorView.theme({
  $: {
    color: text,
    backgroundColor: background,
    '& ::selection': { backgroundColor: selection },
    caretColor: accent,
    '&$focused': { outline: 'none' },
    width: 'auto',
    height: '100%'
  },

  $scroller: {
    fontFamily: 'var(--font-mono)',
    height: '100%',
    fontSize: '13px',
    fontWeight: '400',
    position: 'relative',
    overflowX: 'auto',
    zIndex: 0
  },

  $content: {
    paddingBottom: '70vh',
    maxWidth: '45rem',
    lineHeight: '18px',
    overflowWrap: 'normal'
  },

  '$$focused $cursor': {
    borderLeftColor: accent,
    transition: 'left 0.05s ease-out, top 0.05s ease-out'
  },

  '$$focused $cursorLayer': {
    animation: 'cubic-bezier(0.95, 0, 0.05, 1) cm-blink 1.2s infinite'
  },

  '@keyframes cm-blink': { '0%': {}, '50%': { opacity: '0' }, '100%': {} },
  '@keyframes cm-blink2': { '0%': {}, '50%': { opacity: '0' }, '100%': {} },

  '$$focused $selectionBackground': { backgroundColor: selection },
  '$selectionBackground': { backgroundColor: selection },
  $activeLine: { background: hover },
  $selectionMatch: { backgroundColor: selection },
  $searchMatch: {
    backgroundColor: selection,
    borderRadius: '0.125rem'
  },
  '$searchMatch.selected': {
    backgroundColor: selection,
    boxShadow: `0 0 0 0.075rem ${accent}`
  },

  $line: {
    '& ::selection': { color: 'inherit !important' },
    '&::selection': { color: 'inherit !important' }
  },

  $panels: { backgroundColor: background, color: text },
  '$panels.top': { borderBottom: `2px solid ${border}` },
  '$panels.bottom': { borderTop: `2px solid ${border}` },

  '$matchingBracket, $nonmatchingBracket': {
    backgroundColor: hover,
    outline: `1px solid ${selection}`
  },

  $gutters: {
    backgroundColor: background,
    color: comment,
    border: 'none'
  },
  '$gutterElement.lineNumber': { color: 'inherit' },

  $foldPlaceholder: {
    background: doc,
    border: 'none',
    padding: '0 0.5rem',
    margin: '0 0.25rem',
    color: 'white'
  },

  $tooltip: {
    border: '1px solid #181a1f',
    backgroundColor: '#606862'
  },
  '$tooltip.autocomplete': {
    '& > ul > li[aria-selected]': { backgroundColor: background }
  }
}, { dark: true })

const mt = monarchMarkdown.tags

const confinementHighlightStyle = HighlightStyle.define(
  // Keywords + Operators
  {
    tag: [t.keyword],
    color: keyword
  },
  {
    tag: [t.controlOperator, t.logicOperator, t.compareOperator],
    color: logical
  },
  {
    tag: [t.regexp, t.operator],
    color: operator
  },
  // Names and Types
  {
    tag: [t.name],
    color: ident
  },
  {
    tag: [t.propertyName],
    color: property
  },
  {
    tag: [t.className],
    color: classes
  },
  {
    tag: [t.typeName, t.escape, t.standard(t.name)],
    color: type
  },
  {
    tag: [t.namespace],
    color: entity
  },
  // Functions
  {
    tag: [t.function(t.name), t.function(t.propertyName), t.macroName],
    color: func
  },
  {
    tag: [t.atom, t.annotation, t.special(t.name), t.special(t.string)],
    color: func
  },
  // Literals
  {
    tag: [t.labelName, t.monospace, t.string],
    color: string
  },
  {
    tag: [t.constant(t.name), t.local(t.name), t.literal, t.unit],
    color: constant
  },
  // Changes
  {
    tag: [t.deleted, t.invalid],
    color: invalid
  },
  {
    tag: [t.inserted],
    color: inserted
  },
  {
    tag: [t.changed],
    color: changed
  },
  // Punctuation, Comments
  {
    tag: [t.punctuation],
    color: punct
  },
  {
    tag: [t.meta, t.comment],
    color: comment
  },
  {
    tag: [t.docComment, t.docString],
    color: doc
  },
  // Misc.
  {
    tag: [t.self],
    color: special
  },
  // Markup
  {
    tag: [t.link],
    color: link
  },
  {
    tag: t.url,
    color: link,
    textDecoration: 'underline'
  },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.heading, fontWeight: 'bold', color: tag },
  {
    tag: t.contentSeparator,
    fontWeight: 'bold', color: tag,
    display: 'inline-block', width: 'calc(100% - 1rem)',
    boxShadow: `inset 0 0.125rem 0 ${border}`
  },
  // markdown extended
  { tag: mt.superscript, position: 'relative', top: '-0.25em', fontSize: '90%' },
  { tag: mt.subscript, position: 'relative', top: '0.25em', fontSize: '90%' },
  { tag: mt.underline, textDecoration: 'underline' },
  { tag: mt.strikethrough, textDecoration: 'line-through' },
  { tag: mt.mark, background: important, color: 'black' },
  // critical markup
  { tag: mt.criticHighlight, color: highlight },
  { tag: mt.criticComment, color: note }
)

const confinement: Extension = [confinementTheme, confinementHighlightStyle]

// -- EXPORT EXTENSIONS

export function getExtensions() {
  return [
    lineNumbers(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    highlightSelectionMatches(),
    autocompletion(),
    rectangularSelection(),
    highlightActiveLine(),
    EditorView.lineWrapping,
    indentHack,
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...commentKeymap,
      ...completionKeymap,
      ...[
        { key: 'Mod-Shift-z', run: redo, preventDefault: true },
        { key: 'Mod-d', run: copyLineDown, preventDefault: true }
      ],
      defaultTabBinding
    ]),
    hideGuttersTheme,
    monarchMarkdown.load(),
    confinement
  ]
}

export function getNoEditExtensions() {
  return [
    drawSelection(),
    EditorView.editable.of(false),
    EditorView.lineWrapping,
    indentHack,
    confinement
  ]
}
