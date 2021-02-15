import { EditorState, Extension, tagExtension }                      from '@codemirror/state'
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

import { mfmarkdown }  from './lang'
import { indentHack }  from './indent'
import { confinement } from './theme'

// -- RE-EXPORTS

export type { Extension }

export { EditorState, tagExtension }
export { EditorView, ViewPlugin, ViewUpdate }
export { syntaxTree, LanguageDescription }

export { languages } from './lang'
export { printTree } from './util'

// -- MISC. EXT.

const hideGuttersTheme = EditorView.theme({
  '$.hide-gutters $gutters': {
    display: 'none !important'
  },
  '$.hide-gutters $content': {
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
    mfmarkdown(),
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
