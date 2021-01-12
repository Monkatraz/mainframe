/**
 * @file Extended Markdown language definition for Monarch.
 * @author Monkatraz
 */

import { foldNodeProp } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { createMonarchLanguage } from 'cm6-monarch'

// TODO: color decorators for #color col|
// TODO: accept replacement / deletion / addition actions

const open = (name: string) => {
  return { token: '@rematch', next: '@' + name, parser: { open: name[0].toUpperCase() + name.substr(1) } }
}

const close = (name: string) => {
  return { token: '@rematch', next: '@pop', parser: { close: name[0].toUpperCase() + name.substr(1) } }
}

export default createMonarchLanguage({
  name: 'markdown',
  nestLanguages: languages,
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } }
  },
  configure: {
    props: [
      foldNodeProp.add({
        "Container": (tree, state) => {
          return { from: Math.min(tree.from + 20, state.doc.lineAt(tree.from).to), to: tree.to - 1 }
        },
        "Table": (tree, state) => {
          return { from: state.doc.lineAt(tree.from).to, to: tree.to - 1 }
        },
        "CodeBlock": (tree, state) => {
          return { from: state.doc.lineAt(tree.from).to, to: tree.to }
        },
        "HeadingSection": (tree, state) => {
          return { from: state.doc.lineAt(tree.from).to, to: tree.to - 2 }
        },
        "BlockComment": (tree) => {
          return { from: tree.from, to: tree.to }
        }
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
        [/@s(?!@blocks)[^\s]/, open('paragraph')],

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
        [/<!--/, { token: 'blockComment', next: '@comment_html', parser: { open: 'BlockComment' } }],
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
        [/\/?>/, 'bracket', '@pop'],
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
