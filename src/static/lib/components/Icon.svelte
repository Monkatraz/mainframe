<script lang='ts'>
  import Iconify from '@iconify/iconify'
  import type { IconifyIcon } from '@iconify/iconify'

  export let i = ''
  export let size = '1em'
  export let margin = '0 0'

  let icon: IconifyIcon | null = null
  let viewBox = '0 0 0 0'

  $: if (i) {
    if (Iconify.iconExists(i)) icon = Iconify.getIcon(i)
    else Iconify.loadIcons([i], () => { icon = Iconify.getIcon(i) })
  }

  $: if (icon) viewBox = `${icon.left ?? 0} ${icon.top ?? 0} ${icon.width ?? 0} ${icon.height ?? 0}`
</script>

<svg xmlns="http://www.w3.org/2000/svg"
  aria-hidden='true' focusable='false'
  width={size} height={size} {viewBox} style='margin: {margin}'
  {...$$restProps}
  >
  {@html icon?.body ?? ''}
</svg>

<style lang='stylus'>
  svg
    vertical-align: middle
    transform: rotate(360deg)
</style>
