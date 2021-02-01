<script lang='ts'>
  import { createEventDispatcher } from 'svelte'
  import { keyHandle, tip, Icon } from '@components'

  export let label = ''
  export let value = ''
  export let required = false
  export let info = ''
  export let input: HTMLInputElement | null = null
  // styling
  export let noborder = false
  export let thin = false

  const dispatch = createEventDispatcher()

  const keyHandler = [{ key: 'Enter', preventDefault: true, do() { dispatch('enter') } }]

</script>


<label>
  {#if label}
    <div role='presentation'>
      <span class='label'>{label}</span>
      {#if required}
        <span class='required' use:tip={'This field is required.'}>
          <Icon i='fa-solid:asterisk' size='0.5em' />
        </span>
      {/if}
    </div>
  {/if}
  <input bind:this={input} bind:value use:keyHandle={keyHandler}
    class:thin class:noborder
    {...$$restProps}
  ><span role='presentation' class='text-icon' class:thin />
</label>

{#if info}
  <div class='info'>{info}</div>
{/if}

<style lang='stylus'>
  @require '_lib'

  .label
    padding-left: 0.25em
    color: colvar('text-subtle')
    font-size: 0.875em

  .info
    margin-top: 0.25em
    padding-left: 0.25em
    color: colvar('text-subtle')
    font-size: 0.75em
    line-height: 1.4

  .required
    margin-left: 0.25em
    color: colvar('danger')
    vertical-align: text-bottom

  input
    padding: 0.25em 0.5em
    color: colvar('text')
    background: colvar('background', darken 2.5%)
    border: 0.075rem solid colvar('border')
    border-radius: 0.25em
    box-shadow: inset 0.2em 0 0 -0.1em transparent
    transition: border 0.1s, box-shadow 0.1s

    &.thin
      height: 2em
      padding-top: 0
      padding-bottom: 0

    &.noborder
      border: none

    &::placeholder
      color: colvar('text-dim')
      opacity: 0.5

    &:disabled
      background: colvar('border', darken 2.5%)

    &:focus
      border-color: colvar('hint', opacity 0.5)
      outline: none

    &:valid:not(:placeholder-shown)
      box-shadow: inset 0.2em 0 0 -0.1em colvar('success')

    &:invalid:not(:placeholder-shown)
      box-shadow: inset 0.2em 0 0 -0.1em colvar('danger')

  .text-icon
    position: absolute
    display: inline-block
    width: 2.125em
    height: 2.125em
    background-color: colvar('text-dim')
    transform: translateX(-2em)
    opacity: 0.5
    transition: opacity 0.1s
    user-select: none
    pointer-events: none
    mask-image: var(--icon-text-input)
    mask-repeat: no-repeat
    mask-size: 1.25em
    mask-position: center

    &.thin
      width: 2em
      height: 2em

  input:not(:placeholder-shown) + .text-icon, input:disabled + .text-icon
    opacity: 0

</style>
