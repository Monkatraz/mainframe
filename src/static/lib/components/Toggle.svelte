<script lang='ts'>
  import { keyHandle } from '@components'

  export let toggled = false
  export let small = false

  const keyHandler = [{ key: 'Enter', do() { toggled = !toggled } }]

</script>

<label class:toggled>
  <input type='checkbox' bind:checked={toggled} use:keyHandle={keyHandler} {...$$restProps}>
  <span class='wrapper' role='presentation'>
    {#if $$slots.before}<span class='slot-before'><slot name='before' /></span>{/if}
    <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' viewBox='0 0 24 24'
      width={small ? '1.5em' : '2em'} height={small ? '1.5em' : '2em'}
      >
      <path fill-rule='evenodd' clip-rule='evenodd' class='background'
        d='M24 7a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V7z'
      />
      <path fill='currentColor' class='thumb'
        d='M9 9a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4z'
      />
      </svg>
    <span class='slot-after'><slot /></span>
  </span>
</label>

<style lang='stylus'>
  @require '_lib'

  label
    position: relative

    +on-hover(false)
      .slot
        color: colvar('hint')

  .wrapper
    display: flex
    align-items: center

  .background
    transition: fill 0.15s
    fill: transparent
    stroke: colvar('border')
    stroke-width: 0.125rem

  .toggled .background
    fill: colvar('hint')

  .thumb
    transition: transform 0.25s, fill 0.15s
    fill: currentColor

  .toggled .thumb
    transform: translateX(45%)
    fill: colvar('white')

  .slot-before
    margin-right: 0.5em
    transition: color 0.1s

  .slot-after
    margin-left: 0.5em
    transition: color 0.1s

  input
    position: absolute
    top: 0
    left: 0
    opacity: 0

    &:focus-visible
      ~ .wrapper
        outline: 5px auto Highlight
        outline: 5px auto -webkit-focus-ring-color

        .slot
          color: colvar('hint')

</style>
