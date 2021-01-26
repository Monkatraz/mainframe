<script lang='ts'>
  import { Icon } from '@components'
  export let checked = false
</script>

<label>
  <input type='checkbox' bind:checked>
  <Icon i={checked ? 'fa:check-square' : 'fa:square'}/>
  <span class='slot' {...$$restProps}><slot /></span>
</label>

<style lang='stylus'>
  @require '_lib'

  label
    position: relative

    +on-hover(false)
      .slot
        color: colvar('hint')

  .slot
    margin-left: 0.25em
    transition: color 0.1s

  input
    position: absolute
    top: 0
    left: 0
    opacity: 0

</style>
