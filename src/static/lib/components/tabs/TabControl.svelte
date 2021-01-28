<script lang='ts'>
  import { onMount, setContext } from 'svelte'
  import { writable } from 'svelte/store'
  import type { Writable } from 'svelte/store'

  let ready = false

  let buttons: HTMLElement | undefined
  let panels: HTMLElement | undefined

  let key = writable<any>(null)

  interface Tabs {
    buttons?: HTMLElement
    panels?: HTMLElement
    key: Writable<any>
  }

  const tabs: Tabs = { key }
  setContext('tabs', tabs)

  onMount(() => {
    tabs.buttons = buttons
    tabs.panels = panels
    ready = true
  })

</script>

<div class='tabs' role='presentation'>
  <div bind:this={buttons} class='tab-buttons' role='tablist' />
  <div bind:this={panels} class='tab-panels' role='presentation' >
    {#if ready}<slot/>{/if}
  </div>
</div>

<style lang='stylus'>
  @require '_lib'

  .tabs
    width: 100%

  .tab-buttons
    display: flex
    flex-wrap: wrap

  .tab-panels
    padding: 0.5rem
    border: 0.075rem solid colvar('border')
    border-radius: 0 0 0.25rem 0.25rem

</style>
