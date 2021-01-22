<script lang='ts'>
  import { matchMedia } from '../../modules/util'
  import { toast } from '../../modules/components'
  import UserPanel from '../UserPanel.svelte'
  import IconButton from '../IconButton.svelte'
</script>

<style lang='stylus'>
  .container
    display: flex
    justify-items: center
    align-items: center
    flex-direction: row
    flex-wrap: nowrap
    height: 100%
    width: 100%
    padding-left: 0.25rem
    padding-right: 0.5rem

  .spacer
    flex-grow: 1

  .user-panel-container
    justify-self: flex-end
</style>

<div class='container' role='presentation'>
  <IconButton i='fluent:food-toast-16-filled' size='2.5rem' baseline label='Toast!'
    on:click={() => toast('info', 'Toast!')} />
  {#if $matchMedia('small', 'below')}
    <IconButton i='entypo:menu' size='2.5rem' baseline label='Show Sidebar' />
    <div class='spacer' aria-hidden />
    <div role='presentation' class='user-panel-container'><UserPanel /></div>
  {/if}
</div>