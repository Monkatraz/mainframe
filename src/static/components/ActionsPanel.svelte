<script lang="ts">
  import * as API from '@modules/api'
  import { UserClient } from '@js/mainframe'
  import { usAnime, usTip } from '@js/components'
  import { throttle } from '@js/modules/util'

  // Elements
  let grip: Element

  // State
  let faded = true
  let revealed = false
  let toolTipString = 'Show Page Actions'

  // Animations
  const intro = usAnime({
    bottom: ['-5rem', '0'],
    easing: 'easeOutElastic(1, 1.5)'
  })

  const opts = { easing: 'easeOutElastic(1, 0.8)', duration: 600 }
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

  $PANEL-HEIGHT = 5rem
  $GRIP-HEIGHT = 0.5rem
  $BUTTON-HEIGHT = 2rem
  $HOVER-SHIFT = -0.5rem
  $ACTIVE-SHIFT = -0.75rem

  .actions-panel-container
    position: absolute
    bottom: 0
    left: center
    width: 100%
    filter: drop-shadow(0 0 10px rgba(black, 0.5))
    pointer-events: auto
    // Var for the color to reduce on spam
    --actions-panel-bg: colvar('background-dark')
    // Prevents touch overscrolling (so we can use gestures)
    overscroll-behavior: contain

  +prefix-classes('actions-panel_')

    .border
      position: absolute
      z-index: 10
      bottom: 0
      width: 100%
      height: $GRIP-HEIGHT + 0.1rem
      background: var(--actions-panel-bg)
      border-radius: 10px 10px 0 0
      border-bottom: 1px var(--actions-panel-bg) solid

    .button
      position: absolute
      z-index: 20
      bottom: $GRIP-HEIGHT - 0.2rem // Again tiny overlap
      left: center
      height: $BUTTON-HEIGHT + 0.2rem
      width: 10rem
      background: var(--actions-panel-bg)
      border-radius: 10px 10px 0 0

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
    bottom: $PANEL-HEIGHT * -1
    left: center
    width: 100%
    background: var(--actions-panel-bg)
    // Buffer
    height: $PANEL-HEIGHT + 1rem
    margin-bottom: -1rem

  // Transitions

  .actions-panel-container
    transition: transform 0.25s, opacity 0.25s

  .actions-panel_button, .actions-panel_border
    transition: transform 0.25s

  .actions-panel_button_arrow
    transition: color 0.1s, transform 0.15s

  // Fade Animation

  .actions-panel-container.faded:not(.revealed)
    // Make sure we don't hide the bar for touch users
    +has-only-hover()
      filter: drop-shadow(0 0 10px rgba(black, 0.5)) blur(1px)
      opacity: 0.5
      transform: translate(-50%, 0.5rem)
      pointer-events: none

  // Hover Animation

  // Open
  .actions-panel-container:not(.revealed)
    +on-hover()
      transform: translate(-50%, $HOVER-SHIFT)
      .actions-panel_button_arrow
        color: colvar('white')
        transform: translate(-50%, -50%) !important

  // Closed
  .actions-panel-container.revealed
    .actions-panel_button 
      +on-hover()
        transform: translate(-50%, $HOVER-SHIFT * -0.5)
        + .actions-panel_border
          transform: translateY($HOVER-SHIFT * -0.5)
        .actions-panel_button_arrow
          color: colvar('white')
          transform: translate(-50%, -35%) scaleY(-1) !important

  // Active Animation

  .actions-panel_button:active
    transform: translate(-50%, $ACTIVE-SHIFT * -0.5)
    + .actions-panel_border
      transform: translateY($ACTIVE-SHIFT * -0.5)
    .actions-panel_button_arrow
      transform: translate(-50%, -45%) !important


  .revealed .actions-panel_button:active .actions-panel_button_arrow
    transform: translate(-50%, -25%) scaleY(-1) !important

  // Reveal Animation

  .revealed .actions-panel_button_arrow
    transform: translate(-50%, -40%) scaleY(-1) !important

</style>

<template lang="pug">
  include ../../_basic-mixins

  div.actions-panel-container(
    aria-expanded='{revealed}' 
    class:revealed
    class:faded
    use:intro
    bind:this='{grip}')

    +button().actions-panel_button(
      on:click=`{handleGrip}`
      use:usTip=`{{ content: toolTipString, followCursor: false, sticky: true }}`)

      +ici('round-expand-less').actions-panel_button_arrow

    div.actions-panel_border

    div.actions-panel

</template>