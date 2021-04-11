<script lang='ts'>
  import {
    EditorState, EditorView, Compartment,
    LanguageDescription, languages,
    getNoEditExtensions
  } from 'cm6-mainframe'
  import { onDestroy, onMount } from 'svelte'
  import { createIdleQueued } from '../../modules/util'

  export let content: string | Promise<string>
  export let lang = ''

  let container: HTMLElement
  let view: EditorView

  const update = createIdleQueued(() => getDoc().then((doc) => {
    if (view) view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: doc }
    })
  }))

  const langCompartment = new Compartment()

  $: if (content && view) update()

  $: if (lang && view) getLang().then(lang => view.dispatch({
    effects: langCompartment.reconfigure(lang!)
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
          langCompartment.of(await getLang() ?? [])
        ]
      })
    })
  })

  onDestroy(() => { if (view) view.destroy() })

</script>

<div role='presentation' class:hidden={!view} bind:this={container} />

<style lang='stylus'>
  @require '_lib'

  div
    height: 100%
    opacity: 1
    transition: opacity 0.1s ease-out

    &.hidden
      opacity: 0

</style>
