<script lang='ts'>
  import { tnAnime } from '@modules/anime';

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



<img class=spinny alt="Page Loading Symbol"
  src="data:image/svg+xml,%3Csvg width='120' height='60' viewBox='0 -30 120 30' xmlns='http://www.w3.org/2000/svg' fill='%23323232'%3E%3Cstyle%3E @keyframes load-wave %7B 0%25 %7B transform: translateY(15px); %7D 100%25 %7B transform: translateY(-15px); %7D %7D .ld1 %7B animation: load-wave 0.3s -0.9s infinite alternate ease-in-out; %7D .ld2 %7B animation: load-wave 0.3s -0.8s infinite alternate ease-in-out; %7D .ld3 %7B animation: load-wave 0.3s -0.7s infinite alternate ease-in-out; %7D %3C/style%3E%3Ccircle cx='15' cy='-15' r='15' class='ld1'%3E%3C/circle%3E%3Ccircle cx='60' cy='-15' r='15' class='ld2'%3E%3C/circle%3E%3Ccircle cx='105' cy='-15' r='15' class='ld3'%3E%3C/circle%3E%3C/svg%3E%0A"
  style={cssText + 'transform: translate(-50%, -50%)'}
  in:tnAnime={{scale: [0, 1], opacity: { value: [0, 1], delay: 20, easing: 'easeOutQuad', duration: 200}}}
  out:tnAnime={{scale: 0.8, opacity: 0, easing: 'easeOutQuad', duration: 100}}
>