<script lang='ts'>
  import { tnAnime, toasts } from '../modules/components'
  import { cubicOut } from 'svelte/easing'
  import { Icon, Button } from '@components'

  $: listToasts = Array.from($toasts)

  const icons = {
    success: 'fluent:checkmark-12-filled',
    danger: 'ion:alert',
    warning: 'ph:warning-bold',
    info: 'ion:information'
  }

  function listTransition(elem: Element, animation: { from: DOMRect, to: DOMRect }, params: any ) {
    const d = (animation.from.top - animation.to.top)

    return {
      delay: d > 0 ? 0 : 300,
      duration: 250,
      easing: cubicOut,
      css: (_t: number, u: number) => `top: ${u * d}px`
    }
  }

</script>

<style lang='stylus'>
  @require '_lib'

  .toasts
    display: flex
    align-items: flex-end
    flex-direction: column
    position: absolute
    bottom: 0
    right: 0
    margin: 2rem
    padding: 0

    +match-media(thin, below)
      width: 100%
      align-items: center
      margin: 1rem 0

  .toast
    position: relative
    list-style: none
    width: fit-content
    min-width: 20rem
    max-width: 500px
    padding: 0.5rem 3rem
    border: solid 0.125rem colvar('border')
    border-radius: 0.5rem
    margin: 0.5rem 0
    shadow-elevation(8)

    +match-media(thin, below)
      width: 90%
      min-width: 0
      max-width: none

  .toast_type, .toast_remove
    display: flex
    align-items: center
    justify-items: center
    position: absolute
    top: 0
    height: 100%
    width: 2.25rem
    padding: 0 0.25rem

  .toast_type
    left: 0

  .toast_remove
    right: 0.25rem

  .toast.success
    border-color: colvar('success')
    .toast_type
      background: colvar('success')

  .toast.danger
    border-color: colvar('danger')
    .toast_type
      background: colvar('danger')

  .toast.warning
    border-color: colvar('warning')
    .toast_type
      background: colvar('warning')

  .toast.info
    border-color: colvar('info')
    .toast_type
      background: colvar('info')

</style>

<ul class='toasts' aria-live='polite' aria-relevant='additions'>
  {#each listToasts as toast (toast)}
    <li class='toast dark {toast.type}'
      animate:listTransition
      in:tnAnime={{ translateX: ['150%', '0'] }}
      out:tnAnime={{ translateX: '150%', duration: 300, easing: 'easeInQuint' }}
    >
      <span class='toast_type'><Icon i={icons[toast.type]} size='100%' /></span>
      {toast.message}
      <span class='toast_remove'>
        <Button i='ion:close' size='1.5rem' tip='Close Notification' baseline on:click={toast.remove}/>
      </span>
    </li>
  {/each}
</ul>