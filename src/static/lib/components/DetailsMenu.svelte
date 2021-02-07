<script lang='ts'>
  import { onMount } from 'svelte'
  import type { Placement } from 'tippy.js'
  import { getFoci, keyHandle, placement as popperPlacement } from '@components'

  export let hover = false
  export let open = false
  export let placement: Placement = 'bottom'

  let details: HTMLElement
  let summary: HTMLElement

  function checkClose(evt: PointerEvent) {
    if (!details.hasAttribute('open')) return
    if (!evt.target) return
    if (evt.target === details) return
    if (details.contains(evt.target as Node)) return
    // all checks failed
    details.toggleAttribute('open', false)
  }

  const keyHandler = [
    { key: 'Escape', do() { details.toggleAttribute('open', false) } },
    { key: 'ArrowDown', do() { if (document.activeElement === summary) getFoci(details)[0]?.focus() } }
  ]

  onMount(() => {

    if (details.firstChild?.nodeName === 'SUMMARY')
      summary = details.firstChild as HTMLElement

    details.addEventListener('toggle', () => {
      if (details.hasAttribute('open')) open = true
      else open = false
    })

    if (hover && summary) {
      summary.addEventListener('click', (evt) => {
        details.toggleAttribute('open', !open)
        evt.preventDefault()
      })
      summary.addEventListener('mouseenter', () => {
        details.toggleAttribute('open', true)
      })
      details.addEventListener('mouseleave', () => {
        details.toggleAttribute('open', false)
      })
    }
  })

</script>

<svelte:body on:pointerdown={checkClose} />

<details bind:this={details} use:keyHandle={keyHandler} {...$$restProps}>
  {#if $$slots.summary}<slot name='summary' {open} />{/if}
  <div class='menu' use:popperPlacement={{ when: open && !!summary, pos: placement, against: summary }}>
    <slot {open} />
  </div>
</details>

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

  .menu
    position: absolute
    z-index: 99
    transform: scale(0)

  details[open] .menu
    animation: reveal 0.125s 1 0s backwards ease-out

</style>
