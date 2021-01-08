<script lang='ts'>
  import Iconify from '@iconify/iconify'
  import type { IconifyIcon } from '@iconify/iconify'

  export let i: string = ''

  let icon: IconifyIcon | null = null
  let viewBox: string = '0 0 0 0'

  $: if (i) {
    if (Iconify.iconExists(i)) icon = Iconify.getIcon(i)
    else Iconify.loadIcons([i], () => { icon = Iconify.getIcon(i) })
  }

  $: if (icon) viewBox = `${icon.left} ${icon.top} ${icon.width} ${icon.height}`
</script>

<style lang='stylus'>
  svg
    transform: rotate(360deg)
    vertical-align: -0.135em
</style>

<svg xmlns="http://www.w3.org/2000/svg"
  aria-hidden=true focusable=false
  width=1em height=1em {viewBox}
  >
  {@html icon?.body ?? ''}
</svg>