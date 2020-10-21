<script lang='ts'>
  import { fade } from 'svelte/transition'

  export let top = '50%'
  export let left = '50%'
  export let width = '120px'
  export let fadeIn = {}
  export let fadeOut = {}

  const cssText = `top: ${top}; left: ${left}; width: ${width};`

</script>

<style lang='stylus'>
  @require '_lib'
  .spinny
    position: absolute
    z-index: 99
    transform: translate(-50%, -50%)
    pointer-events: none
</style>

<template lang='pug'>
  img.spinny(
    src='/static/media/spinner.svg', 
    alt='Loading Indicator',
    style='{cssText}',
    in:fade='{fadeIn}',
    out:fade='{fadeOut}'
  )
</template>