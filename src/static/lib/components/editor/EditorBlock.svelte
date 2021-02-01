<script lang='ts'>
  import { EditorState, tagExtension } from '@codemirror/state'
  import { drawSelection, EditorView } from '@codemirror/view'
  import { LanguageDescription } from '@codemirror/language'
  import { languages } from '@codemirror/language-data'
  import { confinement } from './editor-config'
  import { onDestroy, onMount } from 'svelte'
  import { indentHack } from './editor-core'

  function getExtensions() {
    return [
      drawSelection(),
      EditorView.editable.of(false),
      EditorView.lineWrapping,
      indentHack,
      confinement
    ]
  }

  export let content: string | Promise<string>
  export let lang = ''

  let container: HTMLElement
  let view: EditorView

  $: if (content && view) getDoc().then(doc => view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: doc }
  }))

  $: if (lang && view) getLang().then(lang => view.dispatch({
    reconfigure: { 'current-lang': lang }
  }))

  async function getLang() {
    let desc: LanguageDescription | null = null
    if (lang) desc = LanguageDescription.matchLanguageName(languages, lang, true)
    if (desc) return desc.support ?? await desc.load()
  }

  async function getDoc() {
    if (typeof content === 'string') return content
    else return await content
  }

  onMount(async () => {
    view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: await getDoc(),
        extensions: [
          ...getExtensions(),
          tagExtension('current-lang', await getLang() ?? [])
        ]
      })
    })
  })

  onDestroy(() => { if (view) view.destroy() })

</script>

<div role='presentation' bind:this={container} />

<style lang='stylus'>
  @require '_lib'

  div
    height: 100%

</style>
