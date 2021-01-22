<script lang='ts'>
  import { placement } from '../modules/components'
  import { onMount } from 'svelte'
  import Card from './Card.svelte'

  export let hover = false
  export let open = false
  export let title = ''
  export let subtitle = ''
  export let dark = false
  export let light = false

  let details: HTMLElement
  let summary: HTMLElement

  function checkClose(evt: PointerEvent) {
    if (!details.hasAttribute('open')) return
    if (!evt.target) return
    if (evt.target === details) return
    if (details.contains(evt.target as Node)) return
    // all checks failed
    details.removeAttribute('open')
  }

  onMount(() => {
    details.addEventListener('toggle', () => {
      if (details.hasAttribute('open')) open = true
      else open = false
    })
    if (hover) {
      summary.addEventListener('pointerover', () => {
        details.setAttribute('open', '')
      })
      details.addEventListener('pointerleave', () => {
        details.removeAttribute('open')
      })
    }
  })

</script>

<style lang='stylus'>
  @require '_lib'

  @keyframes reveal
    from
      opacity: 0
    to
      opacity: 1

  details
    position: relative
    display: inline-block
    vertical-align: bottom

  summary
    reset-styling(false)
    display: block
    list-style: none
    user-select: none
    cursor: pointer

    > :global([slot='label'])
      display: flex
      align-items: center
      justify-content: center

  .menu
    position: absolute
    transform: scale(0)

  details[open] .menu
    animation: reveal 0.125s 1 0s backwards ease-out

</style>

<svelte:body on:pointerdown={checkClose} />

<details bind:this={details} {...$$restProps}>
  <summary bind:this={summary}><slot name='label' {open} /></summary>
  <div class=menu use:placement={{ when: open && !!summary, pos: 'bottom-end', against: summary }}>
    <Card {title} {subtitle} {dark} {light}><slot {open} /></Card>
  </div>
</details>