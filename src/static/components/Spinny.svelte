<script lang='ts'>
  import { tnAnime } from '@js/components';

  export let top = '50%'
  export let left = '50%'
  export let width = '120px'

  const cssText = `top: ${top}; left: ${left}; width: ${width};`

  const anim = tnAnime({
    translateX: ['-50%', '-50%'],
    translateY: ['-50%', '-50%'],
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 200,
    easing: 'easeInOutSine'
  })

</script>

<style lang='stylus'>
  @require '_lib'
  .spinny
    position: absolute
    display: block
    z-index: 99
    transform: translate(-50%, -50%)
    opacity: 0
    pointer-events: none
</style>

<template lang='pug'>
  img.spinny(
    src='/static/media/spinner.svg'
    alt='Loading Indicator'
    style!='{cssText}'
    transition:anim
  )
</template>