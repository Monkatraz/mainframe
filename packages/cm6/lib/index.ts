import { EditorState, Extension, Compartment }                      from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate, drawSelection, keymap } from '@codemirror/view'

import { highlightActiveLine, highlightSpecialChars }     from '@codemirror/view'
import { history, historyKeymap }                         from '@codemirror/history'
import { foldGutter, foldKeymap }                         from '@codemirror/fold'
import { syntaxTree, indentOnInput, LanguageDescription } from '@codemirror/language'
import { lineNumbers }                                    from '@codemirror/gutter'
import { defaultKeymap, defaultTabBinding }               from '@codemirror/commands'
import { bracketMatching }                                from '@codemirror/matchbrackets'
import { closeBrackets, closeBracketsKeymap }             from '@codemirror/closebrackets'
import { highlightSelectionMatches, searchKeymap }        from '@codemirror/search'
import { autocompletion, completionKeymap }               from '@codemirror/autocomplete'
import { commentKeymap }                                  from '@codemirror/comment'
import { rectangularSelection }                           from '@codemirror/rectangular-selection'
import { redo }                                           from '@codemirror/history'
import { copyLineDown }                                   from '@codemirror/commands'

import { FTMLLanguage }  from './ftml'
import { indentHack }  from './indent'
import { confinement } from './theme'

import { cssCompletion } from '@codemirror/lang-css'
import { htmlCompletion } from '@codemirror/lang-html'

// import { javascript } from '@codemirror/lang-javascript'

// -- RE-EXPORTS

export type { Extension }

export { EditorState, Compartment }
export { EditorView, ViewPlugin, ViewUpdate }
export { syntaxTree, LanguageDescription }

export { languages } from './lang'
export { printTree } from './util'

// -- MISC. EXT.

const hideGuttersTheme = EditorView.theme({
  '&.hide-gutters .cm-gutters': {
    display: 'none !important'
  },
  '&.hide-gutters .cm-content': {
    paddingLeft: '0.5rem'
  }
})

// -- EXPORT

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
    FTMLLanguage.load(),
    cssCompletion,
    htmlCompletion,
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
