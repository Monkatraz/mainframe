<script>
  // Svelte
  import { usAnime } from '@js/modules/components'
  // Components
  import Page from '@components/Page.svelte'
</script>

<style lang='stylus'>
  @require '_lib'

  :global(:root)
    // Basic layout variables
    // These can be edited
    --layout-navbar-height: 2.5rem
    --layout-sidebar-width: 16rem
    --layout-body-max-width: 45rem
    --layout-body-side-gap: 1.5rem

    // Layout variables for smaller devices
    +match-media(thin, below)
      --layout-navbar-height: 3rem
      --layout-sidebar-width: 16rem
      --layout-body-max-width: 45rem
      --layout-body-side-gap: 1rem

    // Variables that probably shouldn't be edited
    --layout-header-height-scalefactor: calc(var(--layout-header-height) / 8)
    //                        Center of screen | Offset to left edge of body | Remove the offset caused by sidebar
    //                                     v                  v                           v
    --layout-body-centering-factor: calc((50vw - (var(--layout-body-max-width) / 2)) - var(--layout-sidebar-width))
    // Total height of the header + navbar
    --layout-total-header-height: calc(var(--layout-header-height) + var(--layout-navbar-height))

  :global(#app)
    color: colvar('text-dark')

  // Shorthands
  // Makes the grid-kiss declaration more compact and visually understandable.
  $nav-h = var(--layout-navbar-height)
  $side-w = var(--layout-sidebar-width)
  $body-w = minmax(0, var(--layout-body-max-width))
  $gp = var(--layout-body-side-gap)
  $lg = minmax(var(--layout-body-side-gap), var(--layout-body-centering-factor))
  $rg = minmax(var(--layout-body-side-gap), 1fr)

  .container
    min-height: calc(100vh - var(--layout-header-height))
    grid-kiss:"+--------------------------------------------+         ",
              "| .navbar                                    | $nav-h  ",
              "+--------------------------------------------+         ",
              "+----------+ +---+ +-------------------+ +---+         ",
              "| .sidebar | |   | | .content          | |   |         ",
              "|          | |   | |                   | |   |         ",
              "|          | |   | |                   | |   |         ",
              "|          | |   | |                   | |   |         ",
              "|          | |   | |                   | |   | auto    ",
              "|          | |   | |                   | |   |         ",
              "|          | |   | |                   | |   |         ",
              "|          | |   | |                   | |   |         ",
              "|          | |   | |                   | |   |         ",
              "|          | |   | |                   | |   |         ",
              "+----------+ +---+ +-------------------+ +---+         ",
              "|  $side-w | |$lg| |      $body-w      | |$rg|         "

    // Small devices foldable sidebar
    +match-media(thin, below)
      grid-kiss:"+------------------------------+         ",
                "| .navbar                      | $nav-h  ",
                "+------------------------------+         ",
                "+---+ +------------------+ +---+         ",
                "|   | | .content         | |   |         ",
                "|   | |                  | |   |         ",
                "|   | |                  | |   |         ",
                "|   | |                  | |   |         ",
                "|   | |                  | |   |         ",
                "|   | |                  | |   | auto    ",
                "|   | |                  | |   |         ",
                "|   | |                  | |   |         ",
                "|   | |                  | |   |         ",
                "|   | |                  | |   |         ",
                "|   | |                  | |   |         ",
                "+---+ +------------------+ +---+         ",
                "|$gp| |      $body-w     | |$gp|         "

  .navbar
    position: relative
    z-index: 80
    background: colvar('gray')
    box-shadow: 0 3px 5px rgba(0,0,0,0.5)

    +match-media(thin, below)
      position: sticky
      top: 0

  .sidebar
    background: colvar('accent')

  .content
    padding: 2rem 0

</style>

<template lang='pug'>
  div.container(role='presentation')
    nav.navbar(aria-label='Navigation')

    aside.sidebar(aria-label='Sidebar')

    main.content(aria-label='Content')
      Page(path='scp/3685')
</template>