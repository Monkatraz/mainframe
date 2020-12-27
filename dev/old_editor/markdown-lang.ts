/**
 * @file Extended Markdown language definition for the Monaco editor.
 * @author Monkatraz
 */

// TODO: color decorators for #color col|

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

function markupWrap(symb: string, token: string, strict = true) {
  symb = escapeRegExp(symb)
  if (strict) {
    const bndry = /\w/.test(symb) ? '\\b' : '\\B'
    return [
      RegExp(`(${bndry}${symb})((?:(?:(?!${symb})[^])|@escapes)+)(${symb}${bndry})`),
      ['delimiter', token, 'delimiter']
    ]
  } else return [
    RegExp(`(${symb})((?:(?:(?!${symb})[^])|@escapes)+)(${symb})`),
    ['delimiter', token, 'delimiter']
  ]
}

export const conf = {
  comments: {
    blockComment: ['/*', '*/'],
    lineComment: '//'
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
    ['#', '|#'],
    ['{++', '++}'],
    ['{--', '--}'],
    ['{~~', '~~}'],
    ['{==', '==}'],
    ['{>>', '<<}']
  ],
  // TODO: add inline formatting to this
  autoClosingPairs: [
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '<', close: '>', notIn: ['string'] },
    { open: '/*', close: '*/' },
    { open: '`', close: '`' },
    { open: '@@', close: '@@' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '`', close: '`' },
    { open: '@@', close: '@@' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  folding: {
    markers: {
      start: new RegExp('^\\s*<!--\\s*#?region\\b.*-->'),
      end: new RegExp('^\\s*<!--\\s*#?endregion\\b.*-->')
    }
  }
}

export const language = {
  defaultToken: 'text',
  tokenPostfix: '.md',
  // escape codes
  control: /[\\`@~*=^$_[\]{}()#+\-.!]/,
  noncontrol: /[^\\`@~*=^$_[\]{}()#+\-.!]/,
  escapes: /\\(?:@control)/,
  // escape codes for javascript/CSS strings
  jsescapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,
  // non matched elements
  empty: [
    'area',
    'base',
    'basefont',
    'br',
    'col',
    'frame',
    'hr',
    'img',
    'input',
    'isindex',
    'link',
    'meta',
    'param'
  ],
  tokenizer: {
    root: [
      { include: '@block' },
      { include: '@linecontent' }
    ],
    global: [
      // auto-detect links (huge frickin' regex )
      // https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
      [/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/,
        'string.link'],

      // comments
      [/^\s*\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],

      // escapes
      [/@@[^]*?@@/, 'escape'],
      [/&\w+;/, 'escape'],
      [/@escapes/, 'escape'],
    ],
    // Block Level State
    block: [

      { include: '@global' },

      // markdown tables
      [/^\s*\|/, '@rematch', '@table_header'],

      // hrs
      // TODO: somehow detect ==== ---- headings
      [/^\s*(-|\*)(?:(?:\s*)?\1){2,}\s*$/, 'keyword.hr'],

      // TODO: use slightly different colors for different # lengths?
      // headers (with #)
      [/^\s*(#+)\s*(?!.*#+$)/, 'keyword.heading'],
      // headers (with # and another # at the end)
      [
        /^(\s{0,3})(#+)((?:[^\\#]|@escapes)+)((?:#+)?)/,
        ['', 'keyword.heading', 'text', 'keyword.heading']
      ],
      // headers (with = or -)
      [/^\s*(=+|-+)\s*$/, 'keyword.heading'],

      // quote
      [/^\s*>+/, 'comment'],

      // list (starting with * or number)
      [/^\s*([*\-+:~]|\d+\.)\s/, 'keyword'],

      // code block (3 tilde)
      [/^\s*~~~\s*((?:\w|[/\-#])+)?\s*$/, { token: 'string', next: '@codeblock' }],

      // github style code blocks (with backticks and language)
      [
        /^\s*```\s*((?:\w|[/\-#])+).*$/,
        { token: 'string', next: '@codeblockgh', nextEmbedded: '$1' }
      ],
      // github style code blocks (with backticks but no language)
      [/^\s*```\s*$/, { token: 'string', next: '@codeblock' }],

    ],
    // Inline Level State
    linecontent: [

      { include: '@global' },

      // inline code
      [/`((?:\w|[/\-#])+)\|/, { token: 'string', next: '@codeblockinline', nextEmbedded: '$1' }],
      // `...` no lang
      [/(`+)((?!\1)[^]|@escapes)+\1/, 'string'],

      // -- markup
      // TODO: nested inline markup
      markupWrap('_', 'emphasis'),
      markupWrap('/', 'emphasis'),
      markupWrap('**', 'strong'),
      markupWrap('*', 'strong'),
      markupWrap('__', 'underline'),
      markupWrap('--', 'strikethrough', false),
      markupWrap('^', 'superscript', false),
      markupWrap('~', 'subscript', false),
      markupWrap('==', 'mark', false),

      // misc. inline or symbols
      [/(#)(\w+\s*)([^#|]*?)(\|)/,
        ['delimiter', 'function', 'variable.parameter', 'delimiter']],
      [/\|#/, 'delimiter'],

      // -- critic markup
      // addition
      [/({\+\+)((?:(?!\+\+})[^]|@escapes)+)(\+\+})/,
        ['critic.addition.delimiter', 'critic.addition', 'critic.addition.delimiter']],
      // deletion
      [/({--)((?:(?!--})[^]|@escapes)+)(--})/,
        ['critic.deletion.delimiter', 'critic.deletion', 'critic.deletion.delimiter']],
      // substitution
      [/({~~)((?:(?!~~}|~>)[^]|@escapes)+)(~>)((?:(?!~~})[^]|@escapes)+)(~~})/,
        [
          'critic.substitution.delimiter',
          'critic.deletion', 'critic.substitution.delimiter', 'critic.addition',
          'critic.substitution.delimiter'
        ]
      ],
      // highlight
      [/({==)((?:(?!==})[^]|@escapes)+)(==})/,
        ['critic.highlight.delimiter', 'critic.highlight', 'critic.highlight.delimiter']],
      // comments
      [/({>>)((?:(?!<<})[^]|@escapes)+)(<<})/,
        ['critic.comment.delimiter', 'critic.comment', 'critic.comment.delimiter']],

      // links
      [/(!?\[)((?:[^\\]|@escapes)+)(\]\([^)]+\))/, ['string.link', 'text', 'string.link']],
      [/(!?\[)((?:[^\\]|@escapes)+)(\])/, ['string.link', 'text', 'string.link']],

      // html
      { include: 'html' }
    ],
    // Misc. States
    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'], // nested comment
      ["\\*/", 'comment', '@pop'],
      [/[/*]/, 'comment']
    ],
    table_header: [
      { include: '@table_common' },
      [/[^|]+/, 'keyword.table.header'] // table header
    ],
    table_body: [{ include: '@table_common' }, { include: '@linecontent' }],
    table_common: [
      [/\s*(?!\w--|--\w)[-:]+\s*/, { token: 'keyword', switchTo: 'table_body' }],
      [/^\s*\|/, 'keyword.table.left'],
      [/^\s*[^|]/, '@rematch', '@pop'],
      [/^\s*$/, '@rematch', '@pop'],
      [/\|/, {
        cases: {
          '@eos': 'keyword.table.right',
          '@default': 'keyword.table.middle' // inner |
        }
      }]
    ],
    codeblock: [
      [/^\s*~~~\s*$/, { token: 'string', next: '@pop' }],
      [/^\s*```\s*$/, { token: 'string', next: '@pop' }],
      [/.*$/, 'variable.source']
    ],
    // github style code blocks
    codeblockgh: [
      [/```\s*$/, { token: 'string', next: '@pop', nextEmbedded: '@pop' }],
      [/[^`]+/, 'variable.source']
    ],
    codeblockinline: [
      [/`/, { token: 'string', next: '@pop', nextEmbedded: '@pop' }],
      [/[^`]+/, 'variable.source']
    ],
    // Note: it is tempting to rather switch to the real HTML mode instead of building our own here
    // but currently there is a limitation in Monarch that prevents us from doing it: The opening
    // '<' would start the HTML mode, however there is no way to jump 1 character back to let the
    // HTML mode also tokenize the opening angle bracket. Thus, even though we could jump to HTML,
    // we cannot correctly tokenize it in that mode yet.
    html: [
      // html tags
      [/<(\w+)\/>/, 'tag'],
      [
        /<(\w+)/,
        {
          cases: {
            '@empty': { token: 'tag', next: '@tag.$1' },
            '@default': { token: 'tag', next: '@tag.$1' }
          }
        }
      ],
      [/<\/(\w+)\s*>/, { token: 'tag' }],
      [/<!--/, 'comment', '@commenthtml']
    ],
    commenthtml: [
      [/[^<-]+/, 'comment.content'],
      [/-->/, 'comment', '@pop'],
      [/<!--/, 'comment.content.invalid'],
      [/[<-]/, 'comment.content']
    ],
    // Almost full HTML tag matching, complete with embedded scripts & styles
    tag: [
      [/[ \t\r\n]+/, 'white'],
      [
        /(type)(\s*=\s*)(")([^"]+)(")/,
        [
          'attribute.name.html',
          'delimiter.html',
          'string.html',
          { token: 'string.html', switchTo: '@tag.$S2.$4' },
          'string.html'
        ]
      ],
      [
        /(type)(\s*=\s*)(')([^']+)(')/,
        [
          'attribute.name.html',
          'delimiter.html',
          'string.html',
          { token: 'string.html', switchTo: '@tag.$S2.$4' },
          'string.html'
        ]
      ],
      [
        /(\w+)(\s*=\s*)("[^"]*"|'[^']*')/,
        ['attribute.name.html', 'delimiter.html', 'string.html']
      ],
      [/\w+/, 'attribute.name.html'],
      [/\/>/, 'tag', '@pop'],
      [
        />/,
        {
          cases: {
            '$S2==style': {
              token: 'tag',
              switchTo: 'embeddedStyle',
              nextEmbedded: 'text/css'
            },
            '$S2==script': {
              cases: {
                $S3: {
                  token: 'tag',
                  switchTo: 'embeddedScript',
                  nextEmbedded: '$S3'
                },
                '@default': {
                  token: 'tag',
                  switchTo: 'embeddedScript',
                  nextEmbedded: 'text/javascript'
                }
              }
            },
            '@default': { token: 'tag', next: '@pop' }
          }
        }
      ]
    ],
    embeddedStyle: [
      [/[^<]+/, ''],
      [/<\/style\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
      [/</, '']
    ],
    embeddedScript: [
      [/[^<]+/, ''],
      [/<\/script\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
      [/</, '']
    ]
  }
}