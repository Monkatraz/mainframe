<script lang='ts'>
  import { matchMedia, UserPanel, Button } from '@components'
  import DevMenu from './DevMenu.svelte'
</script>

<div class='container' role='presentation'>
  {#if $matchMedia('small', 'below')}
    <Button i='entypo:menu' size='2.5rem' baseline tip='Show Sidebar' />
    <DevMenu />
    <div class='spacer' aria-hidden />
    <div role='presentation' class='user-panel-container'><UserPanel /></div>
  {:else}
    <DevMenu />
  {/if}
</div>

<style lang='stylus'>
  .container
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    align-items: center
    justify-items: center
    width: 100%
    height: 100%
    padding-right: 0.5rem
    padding-left: 0.25rem

  .spacer
    flex-grow: 1

  .user-panel-container
    justify-self: flex-end
</style>