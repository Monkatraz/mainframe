/**
 * @file Exports the Monaco editor configuration and theme that Mainframe uses.
 * @author Monkatraz
 */

import type monaco from 'monaco-editor'

/* eslint-disable no-useless-escape */
export const settings: monaco.editor.IStandaloneEditorConstructionOptions = {
  language: 'markdown-extended',
  // Functionality
  minimap: { enabled: false },
  autoClosingBrackets: 'languageDefined',
  autoClosingQuotes: 'languageDefined',
  suggest: { showWords: false },
  codeLens: false,
  // Appearance
  colorDecorators: true,
  "semanticHighlighting.enabled": true,
  occurrencesHighlight: false,
  showUnused: true,
  matchBrackets: "near",
  renderLineHighlight: "all",
  renderLineHighlightOnlyWhenFocus: true,
  smoothScrolling: true,
  cursorStyle: "line-thin",
  cursorBlinking: "smooth",
  glyphMargin: false,
  padding: { top: 10 },
  // Font
  fontFamily: 'var(--font-mono)',
  fontSize: 14,
  fontWeight: "400",
  fontLigatures: true,
  lineHeight: 20,
  renderWhitespace: 'none',
  // Text
  wordWrap: 'bounded',
  wordWrapColumn: 90,
  wrappingIndent: 'same',
  wrappingStrategy: 'advanced',
  tabSize: 2,
  value:
    `## Syntax
***
##### Inline Formatting:
| | | |
| :--: | :-- | :-- |
| \`/.../\` | Italics | /This is italicized, without using \`<em>\`./
| \`_..._\` | Emphasis | _This is actually emphasis._
| \`*...*\` | Bold | *This is just bolded text.*
| \`**...**\` | Strong | **This is very important, strong text.**
| \`__...__\` | Underline | __This is underlined, not emphasized.__
| \`^...^\` | Superscript | 10^10^ Some^tiny text.^
| \`~...~\` | Subscript | X~1~, X~2~, Some~more tiny text.~
| \`--...--\` | Strikethrough | --This text was a mistake.--
| \`==...==\`| Mark | ==This text is important for some reason, and is suitably highlighted.==

##### Critical Markup:
| | | |
| :--: | :-- | :-- |
| \`{++...++}\` | Addition | {++You should add this text.++}
| \`{--...--}\` | Deletion | {--You should delete this text.--}
| \`{~~...~>...~~}\` | Substitution | {~~Replace this,~>With this.~~}
| \`{==...==}\` | Highlight | {==You should take note of this text.==}
| \`{>>...<<}\` | Comment | {==This highlighted text is...==}{>>Followed by a comment.<<}

##### Special:
| | | |
| :--: | :-- | :-- |
| \`\` \`...\` \`\` | Monospace | \`Monospaced text.\`
| \`\` \`lang|...\` \`\`| Inline Code | \`js|console.log('Inline code!')\`
| \`$...$\` | Math (TeX) | $\int_{-\infty}^\infty e^{-x^2}\,dx =\sqrt{\pi}$.
| \`@@...@@\`| Escaped | @@/This text is __escaped__, and **will only be rendered as plain text.**/@@

###### Inline Spans:
-	#font sans|Here is the sans font.|#
-	#font display|Here is the display font.|#
- #font serif|Here is the serif font.|#
- #font mono|Here is the mono font.|#
- #font handwriting|Here is the handwriting font.|#
- #font cursive|Here is the cursive font.|#
- #font 100|100|# #font 200|200|# #font 300|300|# #font 400|400|# #font 500|500|# #font 600|600|# #font 700|700|# #font 800|800|# #font 900|900|#
- #font bold|Bold.|# #font light|Light.|#
- #font bolder|Bolder.|# #font lighter|Lighter.|#
- #font 1em|1em|# #font 1.5em|1.5em|# #font 2em|2em|# #font 2.5em|2.5em|# #font 3em|3em|#
- #font 150%|150%|# #font 12px|12px|# #font 2rem|2rem|#
- #font handwriting bold 1.25em|Mixed font style text.|#

- #class fs-serif|Setting font class manually.|#
- #class fs-mono token function|Multiple classes.|#
- #class fs-serif|Nesting #color red|with|# #font sans bold|inline elements.|#|#

\`\`\`ts
  (self as any).MonacoEnvironment = {
  getWorker: function(moduleId:string, label:string) {
    console.log("Getting worker", moduleId, label)
    return new Worker('web_modules/monaco-editor/esm/vs/editor/editor.worker.js', {
      type: import.meta.env.MODE === 'development' ? "module" : "classic"
    })
  }
}
\`\`\``
}

export const theme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // default color
    { token: '', foreground: '#ABB2BF' },

    { token: 'delimiter', foreground: '#727d9c' },

    { token: 'operators', foreground: '#56B6C2' },

    { token: 'keyword', foreground: '#C678DD' },

    { token: 'string', foreground: '#98C379' },
    { token: 'entity', foreground: '#98C379' },
    { token: 'namespace', foreground: '#98C379' },
    { token: 'regexp', foreground: '#98C379' },

    { token: 'escape', foreground: '#E5C07B' },
    { token: 'string.escape', foreground: '#E5C07B' },
    { token: 'constructor', foreground: '#E5C07B' },
    { token: 'type', foreground: '#E5C07B' },

    { token: 'predefined', foreground: '#919AF7' },

    { token: 'comment', foreground: '#5C6370' },
    { token: 'comment.doc', foreground: '#687387' },

    { token: 'variable', foreground: '#2D8EDF' },
    { token: 'identifier', foreground: '#2D8EDF' },

    { token: 'function', foreground: '#61AFEF' },

    { token: 'constant', foreground: '#D19A66' },
    { token: 'number', foreground: '#D19A66' },

    { token: 'tag', foreground: '#E06C75' },
    { token: 'attribute', foreground: '#FFCB6B' },

    // Markdown Specific

    // misc. symbols
    { token: 'keyword.md', foreground: '#61AFEF' },
    { token: 'keyword.heading.md', foreground: '#E06C75' },
    { token: 'keyword.table', foreground: '#687387' },
    { token: 'keyword.table.header', foreground: '#ABB2BF' },
    { token: 'delimiter.md', foreground: '#C678DD' },
    // inline formatting
    { token: 'text.md', foreground: '#ABB2BF' },
    { token: 'underline.md', fontStyle: 'underline' },
    { token: 'emphasis.md', fontStyle: 'italic' },
    { token: 'strong.md', fontStyle: 'bold' },
    // misc. elements
    { token: 'variable.parameter.md', foreground: '#D19A66' },
    { token: 'string.link', foreground: '#64a0ff' },
    // critic markup
    { token: 'critic.addition', foreground: '#54D169' },
    { token: 'critic.addition.delimiter', foreground: '#32FF41' },
    { token: 'critic.deletion', foreground: '#E04B36' },
    { token: 'critic.deletion.delimiter', foreground: '#FF3214' },
    { token: 'critic.substitution.delimiter', foreground: '#FF9614' },
    { token: 'critic.highlight', foreground: '#C878C8' },
    { token: 'critic.highlight.delimiter', foreground: '#DB84DB' },
    { token: 'critic.comment', foreground: '#5694D6' },
    { token: 'critic.comment.delimiter', foreground: '#3296FF' },

    // Color Extensions Hack
    // This is a hack that allows us to expose CSS class names for token colors.
    // This lets us extend what styling is possible for tokens by giving them an unique color.
    // For example, you can't do strikethrough unless you do a hack like this.
    // This is _very much_ not supported by Monaco.
    // You can still extract the color map if you know where to look.

    // 160, 165, 180
    { token: 'strikethrough.md', foreground: '#A0A5B4' },
    // 50, 50, 60
    { token: 'mark.md', foreground: '#32323C' },
    // 190, 195, 205
    { token: 'superscript.md', foreground: '#BEC3CD', fontStyle: 'italic' },
    // 195, 190, 205
    { token: 'subscript.md', foreground: '#C3BECD', fontStyle: 'italic' },
    // 225, 100, 110
    { token: 'keyword.hr.md', foreground: '#E1646E' },

  ],
  colors: {
    // -1
    "editorIndentGuide.activeBackground": "#4C5366",
    // 0
    "editorRuler.foreground": "#333842",
    "editorIndentGuide.background": "#333842",
    // 1
    "editor.background": "#282C34",
    // 3
    "editorHoverWidget.background": "#21252B",
    "editorHoverWidget.border": "#21252B",
    "editorSuggestWidget.background": "#21252B",
    "editorSuggestWidget.border": "#21252B",
    "editorWidget.background": "#21252B",
    // 4
    "widget.shadow": "#181A1F",
    "menu.background": "#181A1F",
    "menu.border": "#181A1F",
    "quickInput.background": "#181A1F",
    "dropdown.background": "#181A1F",
    "dropdown.listBackground": "#181A1F",
    "dropdown.border": "#181A1F",
    // Against
    "input.background": "#181A1F55",
    "input.border": "#181A1F55",
    // Selection
    "editorBracketMatch.background": "#4B5365A6",
    "editor.selectionBackground": "#4B5365A6",
    "editor.selectionHighlightBackground": "#4B5365A6",
    "editor.wordHighlightBackground": "#4B5365A6",
    // Text
    "foreground": "#ABB2BF",
    "editor.foreground": "#ABB2BF",
    "menu.foreground": "#ABB2BF",
    "editorLineNumber.foreground": "#4B5365",
    "dropdown.foreground": "#D7DAE0",
    // Hover
    "editorLineNumber.activeForeground": "#9DA5B4",
    "list.hoverBackground": "#2F333D",
    "list.hoverForeground": "#9DA5B4",
    // Active
    "list.focusBackground": "#3A3F4B",
    "list.focusForeground": "#D7DAE0",
    "selection.background": "#9DA5B4",
    // Accent
    "panelTitle.activeBorder": "#4D78CC",
    "editorCursor.foreground": "#4D78CC",
    "button.background": "#4D78CC",
    "progressBar.background": "#4D78CC",
    // Against Accent
    "button.foreground": "#FFFFFF",
    // Accent Hover
    "button.hoverBackground": "#6187D2",
    "extensionButton.prominentHoverBackground": "#6187D2",
    // Scrollbar
    "scrollbarSlider.activeBackground": "#4C5366",
    "scrollbarSlider.background": "#4C536688",
    "scrollbarSlider.hoverBackground": "#4C536688",
    // Invisible
    "editorBracketMatch.border": "#0000",
    "contrastActiveBorder": "#0000",
    "contrastBorder": "#0000",
    "focusBorder": "#0000",
    "editor.lineHighlightBorder": "#0000",
    "editorOverviewRuler.border": "#0000",
    "scrollbar.shadow": "#0000",
  }
}