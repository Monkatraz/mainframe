<script lang="ts">
  import { onSwipe } from '../modules/gestures'
  import { Agent } from '../modules/util'
  import { tnAnime, usAnime } from '../modules/anime'
  import { throttle } from '../modules/util'

  // Props
  export let hidden = true

  // Elements
  let grip: HTMLElement

  // State
  let faded = true
  let revealed = false
  let toolTipString = 'Show Page Actions'

  // Misc
  const contextmenu = (evt: Event) => {
    if (Agent.isMobile) {
      // This is so that when you long press the button, you will instead see the tooltip
      // Otherwise, a long press would bring up the sorta right click context menu on mobile
      evt.preventDefault()
      evt.stopImmediatePropagation()
      return false
    }
  }

  // Animations

  const opts = { easing: 'easeOutElastic(1.5, 2)', duration: 400 }
  const panelOpen = usAnime({
    bottom: 0,
    ...opts
  })

  const panelClose = usAnime({
    bottom: '-5rem',
    ...opts
  })

  $: if (hidden) revealed = false

  // Unfade if mouse is near (simple Y value check, nothing complex)
  window.addEventListener('mousemove', throttle(() => {
    const mouseNotNear = Agent.mouseY < 0.9
    if (!faded && mouseNotNear) faded = true
    else if (faded && !mouseNotNear) faded = false
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

  .actions-panel-container
    position: sticky
    z-index: 90
    bottom: calc(var(--actions-panel-height) * -1)
    width: 100%
    height: var(--actions-panel-total-height)
    margin-top: calc(var(--actions-panel-total-height) * -1)
    background: none
    filter: drop-shadow(0 0 10px rgba(black, 0.5))
    pointer-events: auto
    touch-action: none

    +match-media(thin, below)
      margin-left: calc(var(--layout-body-side-gap) * -1)
      width: calc(100% + var(--layout-body-side-gap) * 2)

  +prefix-classes('actions-panel_')

    .border
      position: absolute
      z-index: 10
      top: var(--actions-panel-button-height)
      width: 100%
      height: var(--actions-panel-border-height)
      background: colvar('background')
      border-radius: 10px 10px 0 0

      +match-media(thin, below)
        border-radius: 0

    .button
      position: absolute
      z-index: 20
      top:  0
      left: 50%
      transform: translateX(-50%)
      height: var(--actions-panel-button-height)
      width: 10rem
      background: colvar('background')
      border-radius: 10px 10px 0 0
      // Overlap
      margin-bottom: -0.1rem

    .button_arrow
      position: absolute
      display: block
      top: 50%
      left: 50%
      transform: translate(-50%, -45%) !important
      color: colvar('lightgray')
      font-size: 3.5rem
      pointer-events: none

  .actions-panel
    position: absolute
    bottom: 0
    left: 50%
    transform: translateX(-50%)
    width: 100%
    background: colvar('background', lighten 15%)
    border-left: var(--actions-panel-border-height) colvar('background') solid
    border-right: var(--actions-panel-border-height) colvar('background') solid
    box-shadow: inset 0 0 10px -2px rgba(black, 0.5)
    // Overlap
    height: calc(var(--actions-panel-height) + 1rem)
    margin-bottom: -1rem

    +match-media(thin, below)
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
      transform: translateY(0.5rem)
      pointer-events: none

  // Hover Animation

  // Open
  .actions-panel-container:not(.revealed)
    +on-hover()
      transform: translateY(var(--actions-panel-hover-shift))
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

{#if !hidden}
  <div class='actions-panel-container dark'
    aria-expanded={revealed}
    class:revealed class:faded
    in:tnAnime={{bottom: ['-8rem', '-5rem'], easing: 'easeOutElastic(1, 1.5)', delay: 300}}
    out:tnAnime={{bottom: '-6rem', opacity: 0, easing: 'easeOutQuad', duration: 100}}
    use:onSwipe={{callback: handleGrip, direction: revealed ? 'down' : 'up'}}
    bind:this={grip}>

    <button type=button class=actions-panel_button
      on:click={handleGrip}
      on:contextmenu={contextmenu}>
      <span class="iconify-inline actions-panel_button_arrow" data-icon=ic:round-expand-less></span>
    </button>

    <div class=actions-panel_border/>
    <div class=actions-panel/>
  </div>
{/if}