<script lang='ts'>
  import { tnAnime } from '@js/modules/components';

  export let top = '50%'
  export let left = '50%'
  export let width = '120px'

  const cssText = `top: ${top}; left: ${left}; width: ${width};`

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

<img class=spinny src="/static/media/spinner.svg" alt="Page Loading Symbol"
  style={cssText}
  in:tnAnime|local={{scale: [0.8, 1], opacity: 1}}
  out:tnAnime|local={{scale: 0.5, opacity: 0, easing: 'easeOutQuad', duration: 200}}
>