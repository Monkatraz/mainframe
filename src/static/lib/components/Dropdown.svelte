<script lang='ts'>
  import { onMount } from 'svelte';

  export let hover = false
  export let open = false
  export let width = 'auto'

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
    list-style: none
    user-select: none
    cursor: pointer

    > :global([slot='label'])
      display: flex
      align-items: center
      justify-content: center

  .menu
    position: absolute
    top: 100%
    right: 0
    padding: 0.5rem 0.5rem
    background: colvar('background')
    border: solid 0.1rem colvar('border')
    border-radius: 0.5rem
    shadow-elevation(2, 0.85)

  details[open]
    .menu
      animation: reveal 0.125s 1 0s backwards ease-out

</style>

<svelte:body on:pointerdown={checkClose} />

<details bind:this={details} {...$$restProps}>
  <summary><slot name='label' {open} /></summary>
  <div style='width: {width};' class=menu><slot {open} /></div>
</details>