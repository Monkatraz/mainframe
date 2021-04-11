import { tags as t } from '@codemirror/highlight'
import { foldNodeProp } from '@codemirror/language'
import { TarnationLanguage, lb, re, lkup } from 'cm-tarnation'
import { completeFTML } from './ftml-autocomplete'
import { languages } from './lang'

// TODO: bibliography
// TODO: mailform, sitegrid mini-languages
// TODO: tab (custom syntax)
// TODO: figure out indentation
// TODO: floats

// TODO: make containers work with escaping (oh god)

const TexLanguage = new TarnationLanguage({
  name: 'wikimath',

  languageData: {
    commentTokens: { line: '%' }
  },

  grammar: () => ({
    start: 'root',

    variables: {
      texBrackets: ['(', ')', '[', ']', '{', '}'],
      texSymbols: ['+', '-', '=', '!', '/', '<', '>', '|', "'", ':', '*', '^']
    },

    brackets: [
      { name: 't.paren',         pair: ['(', ')'] },
      { name: 't.brace',         pair: ['{', '}'] },
      { name: 't.squareBracket', pair: ['[', ']'] }
    ],

    fallback: ['t.emphasis'],

    states: {
      root: [
        [/%.*$/, 't.comment'], // %comments

        { style: {
          Function: t.function(t.name),
          Command: t.string
        } },

        [/([a-zA-Z]+)(?=\([^]*?\))/, 'Function'], // styles 'fn()'


        [/(\\#?[a-zA-Z0-9]+)(\{)([^]*?)(\})/, 'CommandGroup',
          ['Command', '@BR', 't.string', '@BR']
        ],

        [/\\#?[a-zA-Z0-9]+/, 'Command'],

        [/\\[,>;!]/, 't.string'],        // spacing
        [/\\+/, 't.escape'],             // \\ and the like
        [/\^(?!\d)|[_&]/, 't.keyword'],  // special keywords/operators

        [/\d+/, 't.unit'],             // numbers
        [/@texSymbols/, 't.operator'], // operators
        [/@texBrackets/, '@BR']        // brackets
      ]
    }
  })
})

export const FTMLLanguage = new TarnationLanguage({
  name: 'FTML',

  nestLanguages: [...languages, TexLanguage.description],

  languageData: {
    commentTokens: { block: { open: '[!--', close: '--]' } },
    autocomplete: completeFTML
  },

  configure: {
    props: [
      // indentNodeProp.add({
      //   BlockContainerContent: context => context.column(context.node.from) + context.unit
      // }),
      foldNodeProp.add({
        'BlockComment': tree =>
          ({ from: tree.from, to: tree.to }),
        'Container': (tree, state) =>
          ({ from: Math.min(tree.from + 20, state.doc.lineAt(tree.from).to), to: tree.to - 1 }),
        'BlockNested BlockContainer': (tree, state) => {
          const from = state.doc.lineAt(tree.from).to
          const to = tree?.lastChild?.from
          if (from && to) return { from, to }
          return null
        }
      })
    ]
  },

  grammar: () => ({

    ignoreCase: true,

    start: 'root',

    variables: {

      esc: / (?:_|\\)$/,

      ws: /[^\S\r\n]/,    // whitespace, no newlines
      s: /^(?!@esc)@ws*/, // starting whitespace
      enl: /^@ws*$/,      // empty new line

      // control characters, aka anything used to maybe signify something
      control:    /[\n!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~\xA1\u2010-\u2027]/,
      nocontrol: /[^\n!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~\xA1\u2010-\u2027]/,
      escapes: /\\@control/,

      // symbols that interrupt a paragraph on line start
      interrupt: /(?:\++\*?@ws)|(?:\[{2,})|(?:[*#]@ws)|(?:[-=]{4,})|(?::)|(?:>+@ws)|(?:>$)|(?:\|{2})/,
      // symbols that represent the starting line syntax of a container
      containers: />+@ws|>$|[*#]@ws/,

      hr: /(?:-{4,}|={4,})@ws*$/,     // horizontal rules
      heading: /(?:\++\*?)@ws+(?!$)/  // headings

    },

    brackets: [
      { name: 'BlockComment', pair: ['[!--', '--]'], tag: 't.blockComment' },

      { name: 't.paren',         pair: ['(', ')'] },
      { name: 't.brace',         pair: ['{', '}'] },
      { name: 't.squareBracket', pair: ['[', ']'] }
    ],

    global: [
      [/@esc/, 't.escape'],
      [/@escapes/, 't.escape'],
      [/(\[!--)([^]+?)(--\])/, 't.blockComment', ['@BR', '', '@BR']],
      [/@nocontrol+/]
    ],

    states: {

      root: [
        { include: '#block_markup' },
        { include: '#inline' },
        { include: '#block' }
      ],

      inline: [
        { include: '#text' },
        { include: '#block' }
      ],

      text: [
        { include: '#special' },
        { include: '#typography' },
        { include: '#markup' }
      ],

      block_markup: [

        { style: {
          HeadingMark: t.heading,
          CenterMark: t.heading
        } },

        // horizontal rules
        [/@s@hr/, 't.contentSeparator'],
        // headings
        [/(@s@heading)(.+?)$/, 'Heading', ['HeadingMark', { strict: false, rules: '#inline' }]],
        // center rule
        [/(@s=@ws+)(.+?)$/, 'Center', ['CenterMark', { strict: false, rules: '#inline' }]]
      ],

      special: [
        // auto-detect links (huge frickin' regex)
        [/(\*?)((?:\w+:\/\/)?(?:[-\w@:%.+~#=]{2,256}\.(?!\.{3}))+?[a-z]{2,6}\b(?:[-\w@:%+.~#?&/=]*))/,
          'LinkInline', ['t.keyword', 't.link']
        ],

        { brackets: [
          { name: 'IncludeVariable', pair: ['{$', '}'], hint: 'vi', tag: 't.bracket' },
          { name: 'PageVariable',    pair: '%%',        hint: 'vp', tag: 't.bracket' }
        ] },

        // include variables
        [/(\{\$)(.*?)(\})/, 'IncludeVariable', ['@BR:vi', 't.variableName', '@BR:vi']],

        // page variables
        [/(%%)(.*?)(%%)/, 'PageVariable', [
          '@BR/O:vp',
          { rules: [
            [/^[^{}]+/, 't.variableName'],
            [/(\{)(.*?)(\})$/, 'PageVariableAccessor', ['@BR', 't.string', '@BR']]
          ] },
          '@BR/C:vp'
        ]]
      ],

      typography: [
        // TODO: make this less insane somehow

        { style: { Typography: t.processingInstruction } },

        // most of these require lookbehinds so they're compiled with the `re` safe regex function
        // blame safari

        // ``quotation''
        [re`/\`\`(?=(?!\`\`).+?'')/`, 'Typography'],
        [re`/(?<=\`\`(?!'').+?)''/`, 'Typography'],

        // `quotation'
        [re`/\`(?=(?!\`).+?')/`, 'Typography'],
        [re`/(?<=\`(?!').+?)'/`, 'Typography'],

        // ,,quotation'' (this one is so damn stupid)
        [re`/,,(?=(?!,,).+?'')/`, 'Typography'],
        [re`/(?<=,,(?!,,).+?)''/`, 'Typography'],

        // <<quotation>>
        [re`/<<(?=(?!<<).+?>>)/`, 'Typography'],
        [re`/(?<=<<(?!>>).+?)>>/`, 'Typography'],

        // >>quotation<<
        [re`/>>(?=(?!>>).+?<<)/`, 'Typography'],
        [re`/(?<=>>(?!<<).+?)<</`, 'Typography'],

        // ...
        [/\.{3}/, 'Typography'],

        // --
        [re`/(?<=\s)--(?=\s)/`, 'Typography']
      ],

      markup: [

        { style: {
          'Escaped EscapedBlock': t.escape,
          'EntityReference': t.character
        } },

        { brackets: [
          { name: 'EscapedBlock', pair: ['@<', '>@'], tag: 't.processingInstruction' },
          { name: 'Escaped',      pair: '@@',         tag: 't.processingInstruction' },
          { name: 'ColorText',    pair: '##',         tag: 't.processingInstruction' }
        ] },

        // raw escape block
        [/(@<)(.+?)(>@)/, 'EscapedBlock',
          ['@BR', { strict: false, rules: [[/&[\w#]+;/, 'EntityReference']] }, '@BR']
        ],

        // escape
        [/(@@)(.*?)(@@)/, 'Escaped', ['@BR/O', '', '@BR/C']],

        // colored text
        [/(##)(\w+)(\|)/, ['@BR/O', 't.color', 't.separator'], { parser: '>>ColorText' }],
        ['##', '@BR/C', { parser: '>>/ColorText' }],

        // -- FORMATTING

        { style: {
          'Strong/...':        t.strong,
          'Emphasis/...':      t.emphasis,
          'Underline/...':     t.special(t.emphasis),
          'Strikethrough/...': t.special(t.deleted),
          'Mark/...':          t.special(t.inserted),
          'Subscript/...':     t.character, // TODO
          'Superscript/...':   t.character, // TODO
          'Monospace/...':     t.monospace
        } },

        { brackets: [
          { name: 'Strong',        tag: 't.processingInstruction' },
          { name: 'Emphasis',      tag: 't.processingInstruction' },
          { name: 'Underline',     tag: 't.processingInstruction' },
          { name: 'Strikethrough', tag: 't.processingInstruction' },
          { name: 'Subscript',     tag: 't.processingInstruction' },
          { name: 'Superscript',   tag: 't.processingInstruction' },
          { name: 'Monospace',     tag: 't.processingInstruction' }
        ] },

        { variables: {
          formatting: ['**', '//', '__', '--', ',,', '^^', '{{', '}}']
        } },

        // closing formatting
        [[lb`1/\S/`, /(@formatting)(?![^\W\d_])/], { rules: [
          ['**', 'StrongClose',        { parser: '>>/Strong'        }],
          ['//', 'EmphasisClose',      { parser: '>>/Emphasis'      }],
          ['__', 'UnderlineClose',     { parser: '>>/Underline'     }],
          ['--', 'StrikethroughClose', { parser: '>>/Strikethrough' }],
          [',,', 'SubscriptClose',     { parser: '>>/Subscript'     }],
          ['^^', 'SuperscriptClose',   { parser: '>>/Superscript'   }],
          ['}}', 'MonospaceClose',     { parser: '>>/Monospace'     }]
        ] }],

        // opening formatting
        [[lb`!1/\\|\w/`, /(@formatting)(?=(?!\1)\S|@escapes)/], { rules: [
          ['**', 'StrongOpen',        { parser: '>>Strong'        }],
          ['//', 'EmphasisOpen',      { parser: '>>Emphasis'      }],
          ['__', 'UnderlineOpen',     { parser: '>>Underline'     }],
          ['--', 'StrikethroughOpen', { parser: '>>Strikethrough' }],
          [',,', 'SubscriptOpen',     { parser: '>>Subscript'     }],
          ['^^', 'SuperscriptOpen',   { parser: '>>Superscript'   }],
          ['{{', 'MonospaceOpen',     { parser: '>>Monospace'     }]
        ] }]
      ],

      block: [

        { style: {
          BlockName: t.tagName,
          BlockNameModule: t.keyword,
          BlockNameUnknown: t.invalid,

          BlockValue: t.string,

          ModuleName: t.className
        } },

        { variables: {
          // has capturing groups
          lslug: /([:#*]|(?=\/)|(?=[^#*\s]+?[@:][^#*\s]))([^#*\s]+)/,

          bs: /\[{2}(?!\[)(?!\/)/, // block node start
          bsc: /\[{2}\//,          // block closing node start
          be: /(?!\]{3})\]{2}/,    // block node end
          bm: /[*=><](?!=)|f>|f</, // block prefix modifiers
          bsf: /_?(?=@ws|@be)/,    // block name suffix

          tls: /\[{3}(?!\[)/,    // triple link start
          tle: /(?!\]{4})\]{3}/, // triple link end

          blk_map: lkup(['checkbox']),

          blk_val: lkup(['lines', 'newlines']),

          blk_valmap: lkup([/* 'include', */ 'iframe', 'radio', 'radio-button']),

          blk_map_el: lkup([
            'a', 'anchor', 'blockquote', 'quote', 'b', 'bold', 'strong',
            'collapsible', 'del', 'deletion', 'div', 'hidden', 'ins', 'insertion',
            'invisible', 'i', 'italics', 'em', 'emphasis', 'mark', 'highlight',
            'tt', 'mono', 'monospace', 'span', 's', 'strikethrough',
            'sub', 'subscript', 'sup', 'super', 'superscript', 'u', 'underline',
            // unofficial
            'ul', 'ol', 'li'
          ]),

          blk_val_el: lkup(['size']),

          blk_el: lkup([
            // unofficial
            'footnote'
          ]),

          mods: lkup(['Backlinks', 'Categories', 'Join', 'PageTree', 'Rate'])
        } },

        { brackets: [
          { name: 'LinkSingle', pair: ['[', ']'],     hint: 'li', tag: 't.squareBracket' },
          { name: 'LinkTriple', pair: ['[[[', ']]]'], hint: 'li', tag: 't.squareBracket' },
          { name: 'BlockNode',  pair: ['[[/', ']]'],              tag: 't.squareBracket' },
          { name: 'BlockNode',  pair: ['[[', ']]'],               tag: 't.squareBracket' }
        ] },

        // triple links
        [/(@tls)([^\n\[\]]+)(@tle)/, 'LinkTriple', ['@BR:li', { rules: [
          // [[[link | text]]]
          [/^([*#]?)([^|]*)(@ws*\|@ws*)(.*)$/,
            ['t.keyword', 't.link', 't.separator', { strict: false, rules: '#text' }]
          ],
          // [[[link]]]
          [/^([*#]?)([^|]+)$/, ['t.keyword', 't.link']]
        ] }, '@BR:li']],

        // inline math block [[$...$]]
        [/(@bs)(\$)(.*?)(\$)(@be)/, 'BlockInlineMath',
          ['@BR', 't.keyword', { embedded: 'wikimath!' }, 't.keyword', '@BR']
        ],

        // [[math]]
        { begin: [/(@bs)(@bm?)(math)(@bsf)(.*?)(@be)/, 'BlockNode',
            ['@BR', 't.modifier', 'BlockName', 't.modifier', 't.string', '@BR']
          ],
          end:   [/(@bsc)(math)(@be)/, 'BlockNode', ['@BR', 'BlockName', '@BR']],
          type: 'BlockNested',
          embedded: 'wikimath!'
        },

        // [[module css]]
        { begin: [/(@bs)(module)(\s+)(css)(@be)/,  'BlockNode', ['@BR', 'BlockNameModule', '', 'ModuleName', '@BR']],
          end:   [/(@bsc)(module)(@be)/, 'BlockNode', ['@BR', 'BlockNameModule', '@BR']],
          type: 'BlockNested',
          embedded: 'css!'
        },

        // [[css]]
        { begin: [/(@bs)(css)(@be)/,  'BlockNode', ['@BR', 'BlockName', '@BR']],
          end:   [/(@bsc)(css)(@be)/, 'BlockNode', ['@BR', 'BlockName', '@BR']],
          type: 'BlockNested',
          embedded: 'css!'
        },

        // [[html]]
        { begin: [/(@bs)(html)(@be)/,  'BlockNode', ['@BR', 'BlockName', '@BR']],
          end:   [/(@bsc)(html)(@be)/, 'BlockNode', ['@BR', 'BlockName', '@BR']],
          type: 'BlockNested',
          embedded: 'html!'
        },

        // block (map)
        [[/(@bs)(@bm?)/, '@blk_map', /(@bsf)(.*?)(@be)/], 'BlockNode',
          ['@BR', 't.modifier', 'BlockName', 't.modifier', 't.string', '@BR']
        ],

        // block (value)
        [[/(@bs)(@bm?)/, '@blk_val', /(@bsf)(.*?)(@be)/], 'BlockNode',
          ['@BR', 't.modifier', 'BlockName', 't.modifier', 'BlockValue', '@BR']
        ],

        // block (valmap)
        [[/(@bs)(@bm?)/, '@blk_valmap', /(@bsf)(\s*\S*)(.*?)(@be)/], 'BlockNode',
          ['@BR', 't.modifier', 'BlockName', 't.modifier', 'BlockValue', 't.string', '@BR']
        ],

        // block modules
        [[/(@bs)(@bm?)(module)(@bsf)(\s*)/, '@mods', /(.*?)(@be)/], 'BlockNode',
          ['@BR', 't.modifier', 'BlockNameModule', 't.modifier', '', 'ModuleName', 'BlockValue', '@BR']
        ],

        // block containers (map, elements)
        { begin: [[/(@bs)(@bm?)/, '@blk_map_el', /(@bsf)(.*?)(@be)/], 'BlockNode',
            ['@BR', 't.modifier', 'BlockName', 't.modifier', 't.string', '@BR']
          ],
          end: [[/@bsc/, '@blk_map_el', /@be/], 'BlockNode', ['@BR', 'BlockName', '@BR']],
          type: 'BlockContainer'
        },

        // block containers (value, elements)
        { begin: [[/(@bs)(@bm?)/, '@blk_val_el', /(@bsf)(.*?)(@be)/], 'BlockNode',
            ['@BR', 't.modifier', 'BlockName', 't.modifier', 'BlockValue', '@BR']
          ],
          end: [[/@bsc/, '@blk_val_el', /@be/], 'BlockNode', ['@BR', 'BlockName', '@BR']],
          type: 'BlockContainer'
        },

        // block containers (elements)
        { begin: [[/(@bs)(@bm?)/, '@blk_el', /(@bsf)(@be)/], 'BlockNode',
            ['@BR', 't.modifier', 'BlockName', 't.modifier', '@BR']
          ],
          end: [[/@bsc/, '@blk_el', /@be/], 'BlockNode', ['@BR', 'BlockName', '@BR']],
          type: 'BlockContainer'
        },

        // unknown block nodes
        [/(@bs|@bsc)(@bm?)([^\\#*\s\]]+?)(@bsf)(.*?)(@be)/, 'BlockNode',
          ['@BR', 't.modifier', 'BlockNameUnknown', 't.modifier', 't.string', '@BR']
        ],

        // single links
        [/(\[)([^\n\[\]]+)(\])/, 'LinkSingle', ['@BR:li', { rules: [
          // [link text]
          [/^@lslug(@ws+|\|)(.*)$/, ['t.keyword', 't.link', 't.separator', { strict: false, rules: '#text' }]],
          // [link]
          [/^@lslug$/, ['t.keyword', 't.link']],
          // [# anchortext]
          [/^(#)(@ws.+)$/, ['t.keyword', { strict: false, rules: '#text' }]]
        ] }, '@BR:li']]
      ]
    }
  })
})
