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
  export let size = '1em'
  // Summary Mode
  export let summary = false
  // Icon
  export let i = ''
  // Other
  let tipString = ''
  export { tipString as tip }

</script>

{#if !summary}
  <button type='button' {disabled} style='font-size: {size};'
    on:click use:tip={tipString}
    class:wide class:primary class:disabled class:baseline class:active class:icon={i} class:floating class:sharp
    {...$$restProps}>
    {#if i}<Icon {i} size='1em' />{:else}<slot />{/if}
  </button>
{:else}
  <summary disabled={disabled ? true : undefined} style='font-size: {size};'
    on:click use:tip={tipString}
    class:wide class:primary class:disabled class:baseline class:active class:icon={i} class:floating class:sharp
    {...$$restProps}>
    {#if i}<Icon {i} size='1em' />{:else}<slot />{/if}
  </summary>
{/if}

<style lang='stylus'>
  @require '_lib'

  summary
    reset-styling(false)
    list-style: none
    cursor: pointer
    user-select: none

  button, summary
    display: inline-flex
    gap: 0.5ch
    align-items: center
    padding: 0.25rem 1rem
    color: colvar('text-subtle')
    font-size: 1rem
    text-align: center
    vertical-align: middle
    background: colvar('border')
    border-radius: 0.25rem
    transition: background 0.125s, color 0.125s
    shadow-elevation(4)

    &.disabled
      color: colvar('lightgray') !important
      filter: grayscale(50%)
      shadow-elevation(0)

    &.sharp
      border-radius: 0

    &.wide
      display: block
      width: 100%
      text-align: center

    &.primary
      color: colvar('white')
      background: colvar('accent-2')

    &.baseline
      padding: 0.25rem 0.25rem
      background: none
      shadow-elevation(0)

    &.floating
      background: none
      opacity: 0.5
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5))
      transition: color 0.125s, opacity 0.125s
      shadow-elevation(0)

      &.icon
        transition: transform 0.125s, color 0.125s, opacity 0.125s

    &.icon
      display: inline-flex
      align-items: center
      justify-content: center
      padding: 0.25rem 0.25rem

      &.baseline
        padding: 0

    +on-hover()
      color: colvar('hint')
      background: colvar('border', lighten 2.5%)

      &.primary
        color: colvar('white')
        background: colvar('accent-2', lighten 2.5%)

      &.floating
        background: none
        opacity: 1

        &.icon
          transform: scale(1.075)

  :global(details[open]) > summary,
  button:active, button.active,
  summary:active, summary.active
    color: colvar('hint')
    background: colvar('border', darken 2.5%)

    &.primary
      color: colvar('white')
      background: colvar('accent-2', darken 2.5%)

    &.baseline, &.floating
      background: none

    &.floating.icon
      transform: scale(1)
      opacity: 1

  // click only, so not using active class
  button:active, summary:active
    &.baseline
      background: colvar('border', darken 2.5%)

</style>
