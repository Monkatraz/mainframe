/**
 * @file Exports the core Editor API class that is used as the context for the editor.
 * @author Monkatraz
 */

import { EditorState, Extension, tagExtension } from '@codemirror/state'
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
import { copyLineDown, indentLess, indentMore } from '@codemirror/commands'
import { confinement } from './editor-config'
import monarchMarkdown from './monarch-markdown'
// Misc.
import { Writable, writable } from 'svelte/store'
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

export class EditorCore {
  // state
  parent!: Element
  view!: EditorView
  get state() { return this.view.state }
  get doc() { return this.view.state.doc }
  // reactive stores
  activeLines: Writable<Set<number>> = writable(new Set())
  value: Writable<string> = writable('')

  init(parent: Element, doc: string, extensions: Extension[] = []) {

    this.parent = parent

    const updateValue = debounce((doFn: () => string) => {
      this.value.set(doFn())
    }, 50)

    const updateHandler = ViewPlugin.define(() => ({
      update: (update: ViewUpdate) => {
        // update store on change
        if (update.docChanged) { updateValue(() => update.state.doc.toString()) }
        // get active lines
        if (update.selectionSet || update.docChanged) {
          const lines: Set<number> = new Set()
          for (const r of update.state.selection.ranges) {
            const lnStart = update.state.doc.lineAt(r.from).number
            const lnEnd = update.state.doc.lineAt(r.to).number
            if (lnStart === lnEnd) lines.add(lnStart - 1)
            else {
              const diff = lnEnd - lnStart
              for (let i = 0; i <= diff; i++)
                lines.add((lnStart + i) - 1)
            }
          }
          this.activeLines.set(lines)
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

    updateValue(() => this.doc.toString())
  }

  destroy() {
    this.view.destroy()
  }

  // configuration

  heightAtLine(line: number) {
    return this.view.visualLineAt(this.doc.line(line).from).top
  }

  set spellcheck(state: boolean) {
    this.view.dispatch({
      reconfigure: {
        spellcheck: EditorView.contentAttributes.of({ spellcheck: String(state) })
      }
    })
  }

  set gutters(state: boolean) {
    this.view.dispatch({
      reconfigure: {
        'hide-gutters': EditorView.editorAttributes.of({ class: state ? '' : 'hide-gutters' })
      }
    })
  }
}
