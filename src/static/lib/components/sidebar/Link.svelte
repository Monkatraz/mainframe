<script lang='ts'>
  import Icon from '../Icon.svelte'
  export let i = ''
  export let href = ''
  export let small = false
</script>

<style lang='stylus'>
  @require '_lib'

  a
    reset-styling(false)
    display: flex
    align-items: center
    gap: 0.75rem
    height: 3em
    width: 100%
    padding-left: 1rem

    line-height: 0
    color: colvar('text')
    white-space: nowrap
    font-set('display')
    font-size: 1rem
    font-weight: bolder

    transition: background 0.125s

    +on-hover()
      background: rgba(255,255,255,0.125)

  a.small
    height: 2em
    font-set('display')
    font-weight: 300

</style>

<a class:small {href}><Icon {i} size={small ? '1.25em' : '2em'}/> <slot /></a>