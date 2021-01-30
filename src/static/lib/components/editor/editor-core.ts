/**
 * @file Exports the core Editor API class that is used as the context for the editor.
 * @author Monkatraz
 */

import { EditorState, Extension } from '@codemirror/state'
import {
  EditorView, ViewPlugin, ViewUpdate, drawSelection,
  highlightActiveLine, highlightSpecialChars, keymap
} from '@codemirror/view'
import { history, historyKeymap } from '@codemirror/history'
import { foldGutter, foldKeymap } from '@codemirror/fold'
import { indentOnInput } from '@codemirror/language'
import { lineNumbers } from '@codemirror/gutter'
import { defaultKeymap, defaultTabBinding } from '@codemirror/commands'
import { bracketMatching } from '@codemirror/matchbrackets'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { commentKeymap } from '@codemirror/comment'
import { rectangularSelection } from '@codemirror/rectangular-selection'
// Local Extensions
import { redo } from '@codemirror/history'
import { copyLineDown } from '@codemirror/commands'
import { confinement } from './editor-config'
import monarchMarkdown from './monarch-markdown'
// Misc.
import { writable } from 'svelte/store'
import { debounce } from '../../modules/util'

const hideGuttersTheme = EditorView.theme({
  '$.hide-gutters $gutters': {
    display: 'none !important'
  },
  '$.hide-gutters $content': {
    paddingLeft: '0.5rem'
  }
})

function getExtensions() {
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

interface EditorStore {
  /** The current 'value' (content) of the editor. */
  value: string
  /** The lines currently being interacted with by the user.
   *  This includes all selected lines, the line the cursor is present on, etc. */
  activeLines: Set<number>
}

export class EditorCore {

  /** The element the editor is attached to. */
  parent!: Element

  /** The CodeMirror `EditorView` instance the editor interacts with the DOM with. */
  view!: EditorView

  /** The CodeMirror `EditorState` the editor has currently.
   *  The state is immutable and is replaced as the editor updates. */
  get state() { return this.view.state }

  /** The `Text` object of the editor's current state. */
  get doc() { return this.view.state.doc }

  /** A store that allows access to certain reactive values. */
  store = writable<EditorStore>({ value: '', activeLines: new Set() })
  subscribe = this.store.subscribe

  /** Starts the editor. */
  init(parent: Element, doc: string, extensions: Extension[] = []) {

    this.parent = parent

    const updateValue = debounce(() => {
      this.store.update(cur => ({ ...cur, value: this.doc.toString() }))
    }, 50)

    const updateHandler = ViewPlugin.define(() => ({
      update: (update: ViewUpdate) => {
        // update store on change
        if (update.docChanged) { updateValue() }
        // get active lines
        if (update.selectionSet || update.docChanged) {
          const activeLines: Set<number> = new Set()
          for (const r of update.state.selection.ranges) {
            const lnStart = update.state.doc.lineAt(r.from).number
            const lnEnd = update.state.doc.lineAt(r.to).number
            if (lnStart === lnEnd) activeLines.add(lnStart - 1)
            else {
              const diff = lnEnd - lnStart
              for (let i = 0; i <= diff; i++)
                activeLines.add((lnStart + i) - 1)
            }
          }
          this.store.update(cur => ({ ...cur, activeLines }))
        }
      }
    }))

    this.view = new EditorView({
      parent,
      state: EditorState.create({
        doc,
        extensions: [
          ...getExtensions(),
          ...extensions,
          updateHandler
        ]
      })
    })

    updateValue()
  }

  /** Destroys the editor. Usage of the editor object after destruction is obviously not recommended. */
  destroy() {
    this.view.destroy()
  }

  /** Returns the scroll-offset from the top of the editor for the specified line. */
  heightAtLine(line: number) {
    return this.view.visualLineAt(this.doc.line(line).from).top
  }

  /** Whether or not the browser's spellchecker is enabled for the editor. */
  set spellcheck(state: boolean) {
    this.view.dispatch({
      reconfigure: {
        spellcheck: EditorView.contentAttributes.of({ spellcheck: String(state) })
      }
    })
  }

  /** Whether or not the line-numbers and associated gutter panel is shown. */
  set gutters(state: boolean) {
    this.view.dispatch({
      reconfigure: {
        'hide-gutters': EditorView.editorAttributes.of({ class: state ? '' : 'hide-gutters' })
      }
    })
  }
}
