<script lang='ts'>
  export let href = ''
  export let src = ''
  export let label = ''
</script>

<style lang='stylus'>
  @require '_lib'

  a
    display: flex
    align-items: center
    justify-content: center
    height: 2rem
    width: 2rem

  img
    transition: filter 0.1s, transform 0.1s

    +on-hover()
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5))
      transform: scale(1.075)

</style>

<a aria-label={label} {href}><img {src} alt='' aria-hidden/></a>