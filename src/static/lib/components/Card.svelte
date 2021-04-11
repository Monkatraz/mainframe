<script lang='ts'>
  export let title = ''
  export let subtitle = ''
  export let dark = false
  export let light = false
  export let width = 'auto'
</script>

<section style='width: {width};' class:dark class:light class='card' {...$$restProps}>
  <!-- Title and subtitle-->
  {#if title || subtitle}
    <div class='titles' role='presentation'>
      {#if title}<h1>{title}</h1>{/if}
      {#if subtitle}<small>{subtitle}</small>{/if}
    </div>
  {/if}
  <!-- Primary content -->
  <slot />
  <!-- Action group -->
  <div class='actions' role='presentation'><slot name='actions' /></div>
</section>

<style lang='stylus'>
  @require '_lib'

  .card
    padding: 0.5rem
    font-size: 1rem
    background: colvar('background')
    border: solid 0.075rem colvar('border')
    border-radius: 0.5rem
    contain: content
    shadow-elevation(4)

  .titles
    padding-bottom: 0.25rem

  h1
    font-size: 1.25em

  small
    display: block
    color: colvar('text-subtle')

  .actions
    display: block

</style>
