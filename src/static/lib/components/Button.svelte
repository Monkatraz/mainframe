<script lang='ts'>
  import { tip, Icon } from '@components'

  // Styling
  export let wide = false
  export let primary = false
  export let disabled = false
  export let baseline = false
  export let floating = false
  export let sharp = false
  export let active = false
  export let size = '1rem'
  // Summary Mode
  export let summary = false
  // Icon
  export let i = ''
  // Other
  let tipString = ''
  export { tipString as tip }

</script>

<style lang='stylus'>
  @require '_lib'

  summary
    reset-styling(false)
    list-style: none
    user-select: none
    cursor: pointer

  button, summary
    display: inline-flex
    align-items: center
    gap: 0.5ch
    vertical-align: middle
    padding: 0.25rem 1rem
    font-size: 1rem
    text-align: center
    background: colvar('border')
    color: colvar('text-subtle')
    border-radius: 0.25rem
    shadow-elevation(4)
    transition: background 0.125s, color 0.125s

    &.disabled
      filter: grayscale(50%)
      color: colvar('lightgray') !important
      shadow-elevation(0)

    &.sharp
      border-radius: 0

    &.wide
      display: block
      width: 100%
      text-align: center

    &.primary
      background: colvar('accent-2')
      color: colvar('white')

    &.baseline
      background: none
      padding: 0.25rem 0.25rem
      shadow-elevation(0)

    &.floating
      background: none
      opacity: 0.5
      shadow-elevation(0)
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5))
      transition: color 0.125s, opacity 0.125s

      &.icon
        transition: transform 0.125s, color 0.125s, opacity 0.125s

    &.icon
      display: flex
      justify-content: center
      align-items: center
      padding: 0.25rem 0.25rem

    +on-hover()
      background: colvar('border', lighten 2.5%)
      color: colvar('hint')

      &.primary
        background: colvar('accent-2', lighten 2.5%)
        color: colvar('white')

      &.floating
        background: none
        opacity: 1

        &.icon
          transform: scale(1.075)

  :global(details[open]) > summary,
  button:active, button.active,
  summary:active, summary.active
    background: colvar('border', darken 2.5%)
    color: colvar('hint')

    &.primary
      background: colvar('accent-2', darken 2.5%)
      color: colvar('white')

    &.baseline, &.floating
      background: none

    &.floating.icon
      opacity: 1
      transform: scale(1)

</style>

{#if !summary}
  <button type='button' on:click {disabled} use:tip={tipString} style='font-size: {size};'
    class:wide class:primary class:disabled class:baseline class:active class:icon={i} class:floating class:sharp>
    {#if i}<Icon {i} size='1em' />{:else}<slot />{/if}
  </button>
{:else}
  <summary on:click disabled={disabled ? true : undefined} use:tip={tipString} style='font-size: {size};'
    class:wide class:primary class:disabled class:baseline class:active class:icon={i} class:floating class:sharp>
    {#if i}<Icon {i} size='1em' />{:else}<slot />{/if}
  </summary>
{/if}