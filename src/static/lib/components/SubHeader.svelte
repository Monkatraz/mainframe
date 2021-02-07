<script lang='ts'>
  import { router } from 'tinro'
  import { matchMedia, Button, UserPanel } from '@components'

  function goBack() {
    const prev = window.location.href
    history.back()
    setTimeout(() => {
      if (window.location.href === prev) router.goto('/')
    }, 100)
  }

</script>

{#if $matchMedia('thin', 'below')}
  <div class='sub-header dark'>
    <Button i='ion:arrow-back-outline' tip='Go Back' on:click={goBack} baseline size='1.5rem'/>
    <span class='ml-3'><slot /></span>
    <span class='sub-header-user-panel'><UserPanel /></span>
  </div>
{/if}

<style lang='stylus'>
  .sub-header
    z-index: 99
    display: flex
    align-items: center
    height: 2.5rem
    padding: 0 0.5rem

  .sub-header-user-panel
    margin-left: auto
</style>

