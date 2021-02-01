<script lang='ts'>
  import { onMount, setContext } from 'svelte'
  import { writable } from 'svelte/store'
  import type { Writable } from 'svelte/store'
  import { focusGroup } from '@components'

  export let conditional = false

  // styling
  export let noborder = false
  export let contain = false
  export let compact = false

  let ready = false

  let buttons: HTMLElement | undefined

  let key = writable<any>(null)

  interface Tabs {
    buttons?: HTMLElement
    key: Writable<any>
    conditional: boolean
  }

  const tabs: Tabs = { key, conditional }
  setContext('tabs', tabs)

  onMount(() => {
    tabs.buttons = buttons
    ready = true
  })

</script>

<div class='tabs' role='presentation'
  class:noborder class:contain class:compact>
  <div bind:this={buttons} use:focusGroup={'horizontal'} class='tab-buttons' role='tablist' />
  <div class='tab-panels' role='presentation' >
    {#if ready}<slot/>{/if}
  </div>
</div>

<style lang='stylus'>
  @require '_lib'

  .tabs
    width: 100%

    &.contain
      height: 100%

  .tab-buttons
    display: flex
    flex-wrap: wrap

  .compact .tab-buttons
    > :global(.tab_button)
      flex-grow: 0.05

  .tab-panels
    padding: 0.5rem
    border: 0.075rem solid colvar('border')
    border-radius: 0 0 0.25rem 0.25rem
    transition: border-color 0.125s

  .contain .tab-panels
    position: relative
    height: 100%

    > :global(.tab_panel)
      height: 100%

  .noborder .tab-panels
    padding: 0.5rem 0
    border: none
    border-radius: 0

  .compact .tab-panels
    padding-top: 0

</style>
