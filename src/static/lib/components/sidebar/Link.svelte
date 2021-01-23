<script lang='ts'>
  import Icon from '../Icon.svelte'
  export let i = ''
  export let href = ''
  export let small = false
</script>

<a class:small {href}><Icon {i} size={small ? '1.25em' : '2em'}/> <slot /></a>

<style lang='stylus'>
  @require '_lib'

  a
    display: flex
    gap: 0.75rem
    align-items: center
    height: 3rem
    padding-left: 1rem
    font-weight: bolder
    font-size: 1rem

    white-space: nowrap
    transition: background 0.125s
    font-set('display')

    +on-hover()
      background: rgba(255,255,255,0.125)

  a.small
    height: 2rem
    font-set('display')
    font-weight: 300

</style>
