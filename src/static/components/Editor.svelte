<script context="module" lang="ts">
  // Import Monaco and its features
  import * as monaco from '@js/editor/monaco'
  import * as mdLang from '@js/editor/markdown-lang'

  (self as any).MonacoEnvironment = {
    getWorker: function(moduleId:string, label:string) {
      console.log("Getting worker", moduleId, label)
      let workerURL = '/static/js/workers/monaco-worker.js'
      if (label === 'json')
        workerURL = '/static/js/workers/monaco-worker-json.js'
      else if (label === 'css')
        workerURL = '/static/js/workers/monaco-worker-css.js'
      else if (label === 'html')
        workerURL = '/static/js/workers/monaco-worker-html.js'
      else if (label === 'typescript' || label === 'javascript')
        workerURL = '/static/js/workers/monaco-worker-ts.js'
      return new Worker(workerURL, {
        type: import.meta.env.MODE === 'development' ? "module" : "classic"
      })
    }
  }

  // Setup theme
  monaco.editor.defineTheme('confinement', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'delimiter', foreground: '#727d9c' },

      { token: 'operators', foreground: '#56B6C2' },
      { token: 'keyword', foreground: '#56B6C2' },

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

      { token: 'text', foreground: '#ABB2BF' },
      { token: 'underline', foreground: '#61AFEF', fontStyle: 'underline' },
      { token: 'emphasis', foreground: '#61AFEF', fontStyle: 'italic' },
      { token: 'strong', foreground: '#61AFEF', fontStyle: 'bold' },
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
  })
  monaco.editor.setTheme('confinement')

  // Setup markdown lang.
  monaco.languages.register({ id: 'markdown' })
  // the language definition is literally copied from the monaco codebase
  // so the fact that it doesn't type-check is just confusing and ignored
  monaco.languages.setLanguageConfiguration('markdown', mdLang.conf as any)
  monaco.languages.setMonarchTokensProvider('markdown', mdLang.language as any)
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import { renderMarkdown, Prism } from '@modules/markdown'
  import { throttle } from '@modules/util';

  let editorContainer: HTMLElement
  let editor: ReturnType<typeof monaco['editor']['create']>

  // Preview Updating
  let html = ''
  let preview: HTMLElement
  const updateHTML = throttle(async () => { html = await renderMarkdown(editor.getValue()) }, 100)
  const onPageLoad = throttle(() => { if(preview) { Prism.highlightAllUnder(preview) } }, 1000)

  // Load Editor
  onMount(() => {
    editor = monaco.editor.create(editorContainer, {
      language: 'markdown',
      // Functionality
      minimap: { enabled: false },
      autoClosingBrackets: 'languageDefined',
      autoClosingQuotes: 'languageDefined',
      suggest: { showWords: false },
      occurrencesHighlight: false,
      "semanticHighlighting.enabled": true,
      codeLens: false,
      // Appearance
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
      // Text
      wordWrap: 'on',
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
| \`==...==\`| Mark | ==This text is important for some reason, and thus highlighted.==

##### Critical Markup:
| | | |
| :--: | :-- | :-- |
| \`{++...++}\` | Addition | {++You should add this text.++}
| \`{--...--}\` | Deletion | {--You should delete this text.--}
| \`{~~...~>...~~}\` | Substitution | {~~Replace this,~>With this.~~}
| \`{==...==}\` | Highlight | {==You should take note of this text.==}
| \`{>>...<<}\` | Comment | {==This highlighted text is...==}{>>Folllowed by a comment.<<}

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
    })

    editor.onDidChangeModelContent(updateHTML)
    updateHTML()
  })

</script>

<style lang="stylus">
  @require '_lib'

  :global(:root)
    overflow-y: hidden

  $col-bg = #333842
  $hght = calc(100vh - var(--layout-header-height))
  $body-w = minmax(0, var(--layout-body-max-width))
  $edit-w = minmax(50%, 1fr)

  .editor-container
    position: relative
    height: $hght
    width: 100%
    background: $col-bg

    grid-kiss:"+------------------------------------------------+      ",
              "| .topbar                                        | 2rem ",
              "+------------------------------------------------+      ",
              "+---------------+ +----+ +--------------+ +------+      ",
              "| .editor       | |    | | .preview     | |      |      ",
              "|               | |    | |              | |      |      ",
              "|               | |    | |              | |      |      ",
              "|               | |    | |              | |      |      ",
              "|               | |    | |              | |      | auto ",
              "|               | |    | |              | |      |      ",
              "|               | |    | |              | |      |      ",
              "|               | |    | |              | |      |      ",
              "|               | |    | |              | |      |      ",
              "|               | |    | |              | |      |      ",
              "+---------------+ +----+ +--------------+ +------+      ",
              "| $edit-w       | |1rem| |   $body-w    | | 1rem |      "

  .topbar
    background: #23272E
    z-index: 10
    box-shadow: 0 3px 5px rgba(0,0,0,0.5)

  $col-editor-bg = #282C34
  .editor
    background: $col-editor-bg

  .preview
    background: colvar('background-light')
    box-shadow: 0 0 10px rgba(0,0,0,0.5) inset
    padding: 1rem
    overflow-y: scroll
    font-size: 90%


</style>

<svelte:window on:resize={() => editor.layout()}/>

<div class=editor-container>
  <div class=topbar/>
  <div class=editor bind:this={editorContainer}/>
  <div class=preview>
    {#key html}
      <div class=rhythm use:onPageLoad bind:this={preview}>
        {@html html}
      </div>
    {/key}
  </div>
</div>