<script lang='ts'>
  import Iconify from '@iconify/iconify'
  import { tip } from '../modules/components'
  import type { IconifyIcon } from '@iconify/iconify'

  export let i: string = ''
  export let label: string = ''
  export let size: string = '1em'
  export let baseline = false

  let icon: IconifyIcon | null = null
  let viewBox: string = '0 0 0 0'

  $: if (i) {
    if (Iconify.iconExists(i)) icon = Iconify.getIcon(i)
    else Iconify.loadIcons([i], () => { icon = Iconify.getIcon(i) })
  }

  $: if (icon) viewBox = `${icon.left} ${icon.top} ${icon.width} ${icon.height}`
</script>

<style lang='stylus'>
  @require '_lib'

  svg
    transform: rotate(360deg)

  button
    display: inline-flex
    align-items: center
    justify-content: center
    padding: 0.25rem 0.25rem
    background: colvar('border')
    color: colvar('text-subtle')
    border-radius: 0.25rem
    transition: background 0.125s, color 0.125s

    +on-hover()
      &:not(.baseline)
        background: colvar('border', lighten 2.5%)
      color: colvar('hint')

    &:active
      &:not(.baseline)
        background: colvar('border', darken 2.5%)
      color: colvar('hint', darken 10%)

    &.baseline
      background: none
      padding: 0

</style>

<button class:baseline aria-label={label} use:tip on:click type='button'>
  <svg xmlns="http://www.w3.org/2000/svg"
    aria-hidden=true focusable=false
    width={size} height={size} {viewBox}
    {...$$restProps}
    >
    {@html icon?.body ?? ''}
  </svg>
</button>