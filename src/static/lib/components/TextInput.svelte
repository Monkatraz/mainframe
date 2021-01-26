<script lang='ts'>
  import { createEventDispatcher } from 'svelte'
  import { tip, Icon } from '@components'

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
    width: 1.25em
    height: 1.25em
    background-color: colvar('text-dim')
    transform: translate(-1.75em, 0.5em)
    opacity: 0.5
    transition: opacity 0.1s
    user-select: none
    pointer-events: none
    mask-image: var(--icon-text-input)

  input:not(:placeholder-shown) + .text-icon, input:disabled + .text-icon
    opacity: 0

</style>
