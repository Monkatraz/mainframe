<script lang='ts'>
  import { tip } from '@components'
  export let href = ''
  export let src = ''
  export let label = ''
</script>

<a aria-label={label} {href} use:tip><img {src} alt='' aria-hidden/></a>

<style lang='stylus'>
  @require '_lib'

  a
    display: flex
    align-items: center
    justify-content: center
    width: 2rem
    height: 2rem

  img
    transition: filter 0.1s, transform 0.1s

    +on-hover()
      transform: scale(1.075)
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5))

</style>
