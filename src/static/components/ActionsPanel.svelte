<script lang="ts">
  import * as API from '@modules/api'
  import { swipeGesture } from '@modules/gestures'
  import { UserClient } from '@js/mainframe'
  import { usAnime, usTip } from '@js/components'
  import { throttle } from '@js/modules/util'

  // Elements
  let grip: HTMLElement

  // State
  let faded = true
  let revealed = false
  let toolTipString = 'Show Page Actions'

  // Misc
  const contextmenu = (evt: Event) => {
    if (UserClient.isMobile) {
      // This is so that when you long press the button, you will instead see the tooltip
      // Otherwise, a long press would bring up the sorta right click context menu on mobile
      evt.preventDefault()
      evt.stopImmediatePropagation()
      return false
    }
  }

  // Animations
  const intro = usAnime({
    bottom: ['-5rem', '0'],
    easing: 'easeOutElastic(1, 1.5)'
  })

  const opts = { easing: 'easeOutElastic(1.5, 2)', duration: 400 }
  const panelOpen = usAnime({
    bottom: '5rem',
    ...opts
  })

  const panelClose = usAnime({
    bottom: 0,
    ...opts
  })

  // Unfade if mouse is near (simple Y value check, nothing complex)
  window.addEventListener('mousemove', throttle(() => {
    if (UserClient.mouseY > 0.9) faded = false
    else faded = true
  }, 100))

  // State toggling
  function handleGrip() {
    revealed = !revealed
    if (revealed) {
      toolTipString = 'Close Page Actions'
      panelOpen(grip)
    } else {
      toolTipString = 'Show Page Actions'
      panelClose(grip)
    }
  }

</script>

<style lang="stylus">
  @require '_lib'

  // Styling

  :root
    --actions-panel-height: 5rem
    --actions-panel-border-height: 0.5rem
    --actions-panel-button-height: 2rem
    --actions-panel-hover-shift: -0.5rem
    --actions-panel-active-shift: -0.75rem

    +match-media(thin, below)
      --actions-panel-border-height: 1rem

  .actions-panel-container
    position: absolute
    z-index: 90
    bottom: 0
    left: center
    width: 100%
    height: calc(var(--actions-panel-border-height) + var(--actions-panel-button-height))
    filter: drop-shadow(0 0 10px rgba(black, 0.5))
    pointer-events: auto
    touch-action: none

  +prefix-classes('actions-panel_')

    .border
      position: absolute
      z-index: 10
      bottom: 0
      width: 100%
      height: var(--actions-panel-border-height)
      background: colvar('background-dark')
      border-radius: 10px 10px 0 0

      +match-media(thin, below)
        border-radius: 0

    .button
      position: absolute
      z-index: 20
      bottom:  var(--actions-panel-border-height)
      left: center
      height: var(--actions-panel-button-height)
      width: 10rem
      background: colvar('background-dark')
      border-radius: 10px 10px 0 0
      // Overlap
      margin-bottom: -0.1rem

    .button_arrow
      position: absolute
      display: block
      top: center
      left: center
      transform: translate(-50%, -45%) !important
      color: colvar('lightgray')
      font-size: 3.5rem
      pointer-events: none

  .actions-panel
    position: absolute
    bottom: calc(var(--actions-panel-height) * -1)
    left: center
    width: 100%
    background: colvar('background-dark', lighten 15%, desaturate 5%)
    border-left: var(--actions-panel-border-height) colvar('background-dark') solid
    border-right: var(--actions-panel-border-height) colvar('background-dark') solid
    box-shadow: inset 0 0 10px -2px rgba(black, 0.5)
    // Overlap
    height: calc(var(--actions-panel-height) + 1rem)
    margin-bottom: -1rem

    +match-media(thin, only)
      border: none

  // Transitions

  .actions-panel-container
    transition: transform 0.25s, opacity 0.25s

  .actions-panel_button, .actions-panel_border
    transition: transform 0.25s

  .actions-panel_button_arrow
    transition: color 0.1s, transform 0.15s

  // Fade Animation

  .actions-panel-container.faded:not(.revealed)
    +match-media(small, up)
      filter: drop-shadow(0 0 10px rgba(black, 0.5)) blur(1px)
      opacity: 0.5
      transform: translate(-50%, 0.5rem)
      pointer-events: none

  // Hover Animation

  // Open
  .actions-panel-container:not(.revealed)
    +on-hover()
      transform: translate(-50%, var(--actions-panel-hover-shift))
      .actions-panel_button_arrow
        color: colvar('white')
        transform: translate(-50%, -50%) !important

  // Close
  .actions-panel-container.revealed
    .actions-panel_button 
      +on-hover()
        transform: translate(-50%, calc(var(--actions-panel-hover-shift) * -0.5))
        + .actions-panel_border
          transform: translateY(calc(var(--actions-panel-hover-shift) * -0.5))
        .actions-panel_button_arrow
          color: colvar('white')
          transform: translate(-50%, -40%) scaleY(-1) !important

  // Active Animation

  .actions-panel_button:active
    .actions-panel_button_arrow
      transform: translate(-50%, -50%) !important
      color: colvar('white')


  .revealed .actions-panel_button:active
    .actions-panel_button_arrow
      transform: translate(-50%, -35%) scaleY(-1) !important

  // Reveal Animation

  .revealed .actions-panel_button_arrow
    transform: translate(-50%, -45%) scaleY(-1) !important

</style>

<template lang="pug">
  include ../../_basic-mixins

  div.actions-panel-container(
    aria-expanded='{revealed}' 
    class:revealed
    class:faded
    use:intro
    use:swipeGesture=`{{do: handleGrip, direction: revealed ? 'down' : 'up'}}`
    bind:this='{grip}')

    +button().actions-panel_button(
      on:click=`{handleGrip}`
      on:contextmenu=`{contextmenu}`
      use:usTip=`{{ content: toolTipString, followCursor: false, sticky: true }}`)

      +ici('round-expand-less').actions-panel_button_arrow

    div.actions-panel_border

    div.actions-panel

</template>