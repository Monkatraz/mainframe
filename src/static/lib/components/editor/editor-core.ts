/**
 * @file Exports the core Editor API class that is used as the context for the editor.
 * @author Monkatraz
 */

import {
  EditorState, Extension, Compartment,
  EditorView, ViewPlugin, ViewUpdate,
  getExtensions, syntaxTree, printTree
} from 'cm6-mainframe'
// Misc.
import type { Page } from '@schemas'
import * as API from '../../modules/api'
import { Pref, LocalDrafts } from '../../modules/state'
import { debounce } from '../../modules/util'
import { writable } from 'svelte/store'

interface EditorSettings {
  darkmode: boolean
  gutters: boolean
  spellcheck: boolean
  preview: {
    enable: boolean
    darkmode: boolean
    activelines: boolean
  }
}

export const settings = Pref.bind<EditorSettings>('editor-settings', {
  darkmode: true,
  gutters: true,
  spellcheck: false,
  preview: {
    enable: true,
    darkmode: false,
    activelines: true
  }
})

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
  /** The current document of the editor. */
  doc: EditorState['doc']
  /** The current draft state. */
  draft: EditorDraft
  /** The current 'value' (content) of the editor. */
  value: string
}

export class EditorCore {

  /** The element the editor is attached to. */
  parent!: Element

  /** The CodeMirror `EditorState` the editor has currently.
   *  The state is immutable and is replaced as the editor updates. */
  state = EditorState.create()

  /** The `Text` object of the editor's current state. */
  get doc() { return this.view.state.doc }

  /** The CodeMirror `EditorView` instance the editor interacts with the DOM with. */
  view!: EditorView

  /** The local draft instance that is being edited. */
  draft!: EditorDraft

  /** A store that allows reactive access to editor state. */
  store = writable<EditorStore>({ doc: this.state.doc, draft: new EditorDraft(), value: '' })
  subscribe = this.store.subscribe
  set = this.store.set

  /** The lines currently being interacted with by the user.
   *  This includes all selected lines, the line the cursor is present on, etc. */
  activeLines = writable(new Set<number>())

  get scrollTop() { return this.view.scrollDOM.scrollTop }
  set scrollTop(val: number) { this.view.scrollDOM.scrollTop = val }

  /** Starts the editor. */
  async init(parent: Element, source: string | SourceOrigin, extensions: Extension[] = []) {

    this.draft = await EditorDraft.from(source)

    this.parent = parent

    const updateState = debounce(() => this.refresh(), 50)

    const updateHandler = ViewPlugin.define(() => ({
      update: (update: ViewUpdate) => {
        // update store on change
        if (update.docChanged) { updateState() }
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
          this.spellcheckCompartment.of(EditorView.contentAttributes.of({ spellcheck: 'false' })),
          this.guttersCompartment.of(EditorView.editorAttributes.of({ class: '' })),
          updateHandler
        ]
      })
    })

    this.refresh()
  }

  /** Destroys the editor. Usage of the editor object after destruction is obviously not recommended. */
  destroy() {
    this.view.destroy()
  }

  refresh() {
    this.state = this.view.state
    const value = this.doc.toString()
    this.draft.template = value
    this.store.set({
      doc: this.doc,
      draft: this.draft,
      value: value
    })
  }

  // -- SAVING

  async saveLocally() {
    if (!this.draft.name) return false
    await LocalDrafts.put(this.draft.page)
    return true
  }

  // -- MISC.

  /** Returns the scroll-offset from the top of the editor for the specified line. */
  heightAtLine(line: number) {
    return this.view.visualLineAt(this.doc.line(line).from).top
  }

  printTree() {
    return printTree(syntaxTree(this.state), this.doc.toString())
  }

  spellcheckCompartment = new Compartment()
  guttersCompartment = new Compartment()

  /** Whether or not the browser's spellchecker is enabled for the editor. */
  set spellcheck(state: boolean) {
    this.view.dispatch({
      effects: this.spellcheckCompartment.reconfigure(
        EditorView.contentAttributes.of({ spellcheck: String(state) })
      )
    })
  }

  /** Whether or not the line-numbers and associated gutter panel is shown. */
  set gutters(state: boolean) {
    this.view.dispatch({
      effects: this.guttersCompartment.reconfigure(
        EditorView.editorAttributes.of({ class: state ? '' : 'hide-gutters' })
      )
    })
  }
}
