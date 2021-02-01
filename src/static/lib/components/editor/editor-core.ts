/**
 * @file Exports the core Editor API class that is used as the context for the editor.
 * @author Monkatraz
 */

import { EditorState, Extension } from '@codemirror/state'
import {
  EditorView, ViewPlugin, ViewUpdate, drawSelection,
  highlightActiveLine, highlightSpecialChars, keymap, Decoration, DecorationSet
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
import { RangeSetBuilder } from '@codemirror/rangeset'
import type { Line } from '@codemirror/text'
import { redo } from '@codemirror/history'
import { copyLineDown } from '@codemirror/commands'
import { confinement } from './editor-config'
import monarchMarkdown from './monarch-markdown'
// Misc.
import type { Page } from '@schemas'
import * as API from '../../modules/api'
import { toast, LocalDrafts } from '../../modules/state'
import { debounce } from '../../modules/util'
import { writable } from 'svelte/store'

const hideGuttersTheme = EditorView.theme({
  '$.hide-gutters $gutters': {
    display: 'none !important'
  },
  '$.hide-gutters $content': {
    paddingLeft: '0.5rem'
  }
})

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

export const indentHack = ViewPlugin.fromClass(
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

type SourceOrigin = { path: string } | { draft: string, user: API.Ref } | { local: string }

async function resolvePath(source: SourceOrigin): Promise<Page.LocalDraft | undefined> {
  if ('path' in source) {
    try {
      const { version, metadata, locals } = await API.withPage(source.path).request()
      return { name: source.path, version, metadata, locals }
    } catch {}
  }
  // TODO: web-drafts
  if ('draft' in source) { throw new Error('not implemented') }
  if ('local' in source) {
    const name = source.local
    if (await LocalDrafts.has(name))
      return await LocalDrafts.get(name)
  }
}

class EditorDraft {

  page: Page.LocalDraft

  // -- CONVINENCE GETTERS AND SETTERS

  get name() { return this.page.name }
  set name(val: string) { this.page.name = val }

  get version() { return this.page.version }
  set version(val: number) { this.page.version = val }

  get metadata() { return this.page.metadata }
  set metadata(val: Page.Metadata) { this.page.metadata = val }

  lang: string
  get locals() { return Object.keys(this.page.locals) }
  get local() { return this.page.locals[this.lang] }
  set local(val: Page.View) { this.page.locals[this.lang] = val }

  get title() { return this.local.title }
  set title(val: string) { this.local.title = val }

  get subtitle() { return this.local.subtitle }
  set subtitle(val: string) { this.local.subtitle = val }

  get description() { return this.local.description }
  set description(val: string) { this.local.description = val }

  get template() { return this.local.template }
  set template(val: string) { this.local.template = val }

  // -- INIT

  constructor() {
    // default value
    this.page = {
      name: '',
      version: 1,
      metadata: {
        type: 'scp',
        flags: [],
        attributes: [],
        warnings: [],
        context: 'foundation',
        canons: [],
        tags: []
      },
      locals: {
        en: {
          title: '',
          subtitle: '',
          description: '',
          template: ''
        }
      }
    }
    this.lang = 'en'
  }

  // -- API

  /** Static method that creates an EditorPage using the specified source. */
  static async from(source?: SourceOrigin | string) {
    const instance = new EditorDraft()
    if (!source) return instance
    if (typeof source === 'string') {
      instance.template = source
      return instance
    }
    const result = await resolvePath(source)
    if (result) instance.page = result
    instance.lang = instance.locals[0]
    return instance
  }
}

interface EditorStore {
  /** The current draft state. */
  draft: EditorDraft
  /** The current 'value' (content) of the editor. */
  value: string
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

  /** The local draft instance that is currently being edited. */
  draft!: EditorDraft

  /** A store that allows reactive access to editor state. */
  store = writable<EditorStore>({ draft: new EditorDraft(), value: '' })
  subscribe = this.store.subscribe
  set = this.store.set

  /** The lines currently being interacted with by the user.
   *  This includes all selected lines, the line the cursor is present on, etc. */
  activeLines = writable(new Set<number>())

  /** Starts the editor. */
  async init(parent: Element, source: string | SourceOrigin, extensions: Extension[] = []) {

    this.draft = await EditorDraft.from(source)

    this.parent = parent

    const doDraftUpdate = debounce(() => {
      const value = this.doc.toString()
      this.draft.template = value
      this.store.update(cur => ({ ...cur, value }))
    }, 50)

    const updateHandler = ViewPlugin.define(() => ({
      update: (update: ViewUpdate) => {
        // update store on change
        if (update.docChanged) { doDraftUpdate() }
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
          this.activeLines.set(activeLines)
        }
      }
    }))

    const doc = this.draft.template
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

    this.refreshStore()
  }

  /** Destroys the editor. Usage of the editor object after destruction is obviously not recommended. */
  destroy() {
    this.view.destroy()
  }

  refreshStore() {
    this.store.update(cur => ({
      draft: this.draft,
      value: this.doc.toString()
    }))
  }

  // -- SAVING

  async saveLocally() {
    if (!this.draft.name) return false
    await LocalDrafts.put(this.draft.page)
    toast('success', 'Saved!')
    return true
  }

  // -- MISC.

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
