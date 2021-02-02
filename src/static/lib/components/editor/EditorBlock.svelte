<script lang='ts'>
  import {
    EditorState, EditorView, tagExtension,
    LanguageDescription, languages,
    getNoEditExtensions
  } from './codemirror.bundle'
  import { onDestroy, onMount } from 'svelte'

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
          ...getNoEditExtensions(),
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
