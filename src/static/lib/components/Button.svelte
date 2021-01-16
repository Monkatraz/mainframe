<script lang='ts'>
  export let wide = false
  export let primary = false
</script>

<style lang='stylus'>
  @require '_lib'

  button
    display: flex
    align-items: center
    justify-content: center
    flex-grow: 1
    gap: 0.5rem
    padding: 0.25rem 1rem
    font-size: 1rem
    background: colvar('border')
    color: colvar('text-subtle')
    border-radius: 0.25rem
    transition: background 0.125s, color 0.125s

    +on-hover()
      background: colvar('border', lighten 2.5%)
      color: colvar('hint')

    &:active
      background: colvar('border', darken 2.5%)
      color: colvar('hint')

    &.wide
      width: 100%

    &.primary
      background: colvar('accent-2')
      color: colvar('white')

      +on-hover()
        background: colvar('accent-2', lighten 2.5%)
        color: colvar('white')

      &:active
        background: colvar('accent-2', darken 2.5%)
        color: colvar('white')

</style>

<button on:click class:wide class:primary type='button'><slot /></button>