<script lang='ts'>
  import { onMount } from 'svelte';
  import { tip } from '../modules/components'
  import Icon from './Icon.svelte'

  export let i = ''
  export let size = '1.5rem'
  export let hover = false
  export let label = ''

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

  summary
    reset-styling(false)
    display: flex
    align-items: center
    justify-content: center
    list-style: none
    user-select: none
    cursor: pointer

    opacity: 0.5
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5))
    transition: transform 0.1s, opacity 0.1s

    +on-hover()
      opacity: 1
      transform: scale(1.075)

  .menu
    position: absolute
    top: 85%
    right: 0
    padding: 1rem 0.5rem
    padding-top: 0.5rem
    background: colvar('background')
    border: solid 0.1rem colvar('border')
    border-top: none
    border-radius: 0.5rem
    shadow-elevation(2, 0.85)
    filter: 'drop-shadow(0 -0.06rem 0 %s)' % colvar('border')

  .arrow
    position: absolute
    top: -0.75rem
    right: 0.6rem
    fill: colvar('background')

  details[open]
    summary
      opacity: 1
      transform: scale(1.075)

      &:active
        transform: scale(1)

    .menu
      animation: reveal 0.125s 1 0s backwards ease-out

</style>

<svelte:body on:pointerdown={checkClose} />

<details bind:this={details} {...$$restProps}>
  {#if label}
    <summary aria-label={label} use:tip bind:this={summary}><Icon {i} {size}/></summary>
  {:else}
    <summary bind:this={summary}><Icon {i} {size}/></summary>
  {/if}
  <div class=menu>
    <svg class='arrow' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' focusable='false' width='1rem' height='1rem' viewBox='0 0 24 24'><path d='M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z'/></svg>
    <slot />
  </div>
</details>