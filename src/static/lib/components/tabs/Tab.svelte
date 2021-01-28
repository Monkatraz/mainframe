<script lang='ts'>
  import { getContext } from 'svelte'
  import { createID, portal, Button } from '@components'
  import type { Writable } from 'svelte/store'

  const id = createID()

  const buttonID = 'tab-button' + id
  const panelID = 'tab-panel' + id

  interface Tabs {
    buttons?: HTMLElement
    panels?: HTMLElement
    key: Writable<any>
  }

  const { buttons, panels, key } = getContext<Required<Tabs>>('tabs')

  let selected = false
  $: selected = $key === id

  // if the store has no tab selected, set the start tab to this tab
  if (!$key) selectThis()

  function selectThis() { $key = id }

</script>

<span class='tab_button' class:selected use:portal={buttons} role='presentation'>
  <Button baseline sharp wide active={selected} on:click={selectThis}
    id={buttonID} aria-controls={panelID}
    aria-selected={String(selected)}>
    <slot name='button'/>
  </Button>
</span>

<div class='tab_panel' use:portal={panels} hidden={!selected}
  id={panelID} aria-labelledby={buttonID} tabindex='0'>
  <slot />
</div>


<style lang='stylus'>
  @require '_lib'

  .tab_button
    flex-grow: 1
    border-left: 0.075rem solid colvar('border')

    +overlay()
      transition: box-shadow 0.125s
    &.selected::after
      box-shadow: inset 0 -0.125rem 0 0 colvar('hint')

    &:first-child
      border-left: none

  @keyframes reveal
    from
      opacity: 0
    to
      opacity: 1

  .tab_panel
    outline: none
    animation: reveal 0.125s 0s 1 backwards ease-out

</style>
