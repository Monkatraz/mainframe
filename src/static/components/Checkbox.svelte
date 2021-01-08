<script lang='ts'>
  import Icon from './Icon.svelte';
  export let checked = false
</script>

<style lang='stylus'>
  @require '_lib'

  label
    position: relative
    height: 1em

    +on-hover(false)
      .slot
        color: #6187D2

  .slot
    transition: color 0.1s

  input
    position: absolute
    top: 0
    left: 0
    opacity: 0

</style>

<label>
  <input type='checkbox' bind:checked>
  <Icon i={checked ? 'fa:check-square' : 'fa:square'}/>
  <span class='slot'><slot/></span>
</label>