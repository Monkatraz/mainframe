<script lang='ts'>
  import { matchMedia, UserPanel, Button } from '@components'
  import DevMenu from './DevMenu.svelte'
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
  {#if $matchMedia('small', 'below')}
    <Button i='entypo:menu' size='2.5rem' baseline tip='Show Sidebar' />
    <DevMenu />
    <div class='spacer' aria-hidden />
    <div role='presentation' class='user-panel-container'><UserPanel /></div>
  {:else}
    <DevMenu />
  {/if}
</div>