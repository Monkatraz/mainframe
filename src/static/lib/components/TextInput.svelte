<script lang='ts'>
  import { tip } from '../modules/components'
  import { createEventDispatcher } from 'svelte'
  import Icon from './Icon.svelte'

  export let label = ''
  export let value = ''
  export let required = false
  export let info = ''
  export let input: HTMLInputElement = null as unknown as HTMLInputElement

  const dispatch = createEventDispatcher()

  function handleEnter(evt: KeyboardEvent) {
    if (evt.key === 'Enter') {
      evt.preventDefault()
      dispatch('enter')
    }
  }

</script>

<style lang='stylus'>
  @require '_lib'

  .label
    font-size: 0.875em
    color: colvar('text-subtle')
    padding-left: 0.25em

  .info
    font-size: 0.75em
    color: colvar('text-subtle')
    margin-top: 0.25em
    padding-left: 0.25em
    line-height: 1.4

  .required
    vertical-align: text-bottom
    margin-left: 0.25em
    color: colvar('danger')

  input
    padding: 0.25em 0.5em
    background: colvar('background', darken 2.5%)
    border: 0.075rem solid colvar('border')
    box-shadow: inset 0.2em 0 0 -0.1em transparent
    border-radius: 0.25em
    color: colvar('text')
    transition: border 0.1s, box-shadow 0.1s

    &::placeholder
      color: colvar('text-dim')
      opacity: 0.5

    &:disabled
      background: colvar('border', darken 2.5%)

    &:focus
      outline: none
      border-color: colvar('hint', opacity 0.5)

    &:valid:not(:placeholder-shown)
      box-shadow: inset 0.2em 0 0 -0.1em colvar('success')

    &:invalid:not(:placeholder-shown)
      box-shadow: inset 0.2em 0 0 -0.1em colvar('danger')

  .text-icon
    position: absolute
    height: 1.25em
    width: 1.25em
    background-color: colvar('text-dim')
    mask-image: var(--icon-text-input)
    opacity: 0.5
    transform: translate(-1.75em, 0.5em)
    transition: opacity 0.1s
    pointer-events: none
    user-select: none

  input:not(:placeholder-shown) + .text-icon, input:disabled + .text-icon
    opacity: 0

</style>

<label>
  <div role='presentation'>
    <span class='label'>{label}</span>
    {#if required}
      <span class='required' use:tip={'This field is required.'}>
        <Icon i='fa-solid:asterisk' size='0.5em' />
      </span>
    {/if}
  </div>
  <input bind:this={input} bind:value
    on:keydown={handleEnter}
    {...$$restProps}
  ><span role='presentation' class='text-icon' />
</label>
{#if info}
  <div class='info'>{info}</div>
{/if}