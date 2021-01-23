<script lang='ts'>
  import { tnAnime } from '../modules/components'
  import { sleep } from '../modules/util'

  export let top = '50%'
  export let left = '50%'
  export let width = '120px'
  export let wait = 300

  const cssText = `top: ${top}; left: ${left}; width: ${width};`

</script>

{#await sleep(wait) then _ }
  <svg aria-hidden='true' class='spinny'
    {width} viewBox='0 -50 120 70' xmlns='http://www.w3.org/2000/svg'
    style={cssText + 'transform: translate(-50%, -50%)'}
    in:tnAnime={{scale: [0, 1], opacity: { value: 1, delay: 20, easing: 'easeOutQuad', duration: 200}}}
    out:tnAnime={{scale: 0.8, opacity: 0, easing: 'easeOutQuad', duration: 100}}
    >
    <style>
      @keyframes load-wave {
        0% {
          transform: translateY(15px); }
        100% {
          transform: translateY(-15px); }
      }

      .ld1 {
        animation: load-wave 0.3s -0.9s infinite alternate ease-in-out; }
      .ld2 {
        animation: load-wave 0.3s -0.8s infinite alternate ease-in-out; }
      .ld3 {
        animation: load-wave 0.3s -0.7s infinite alternate ease-in-out; }
    </style>

    <circle cx='15' cy='-15' r='15' class='ld1'></circle>
    <circle cx='60' cy='-15' r='15' class='ld2'></circle>
    <circle cx='105' cy='-15' r='15' class='ld3'></circle>
  </svg>
{/await}

<style lang='stylus'>
  @require '_lib'
  .spinny
    position: absolute
    z-index: 99
    display: block
    transform: translate(-50%, -50%)
    pointer-events: none
    fill: colvar('text-subtle')
</style>
