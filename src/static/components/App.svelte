<script lang="ts">
  // Imports
  import * as API from '@js/modules/api'
  import { ENV } from '@modules/util'
  import { usAnime } from '@modules/components'
  import { renderPage} from '@modules/markdown'
  import { Route, router } from 'tinro'
  import { fade } from 'svelte/transition'
  import Page from './Page.svelte'

  // TODO: make a separate 404 page so that its indexed correctly
  // TODO: set page metadata

  // -- ANIMATIONS
  const sideBarReveal = usAnime({
    translateX: ['-100%', '0%'],
    duration: 500,
    easing: 'easeOutElastic(3, 2)',
    delay: 50
  })
  const navBarReveal = usAnime({
    scaleY: [0, 1],
    duration: 300,
    easing: 'easeOutElastic(2, 1.25)'
  })

</script>

<style lang="stylus">
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
    position: relative
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
    transform-origin: top

    +match-media(thin, below)
      position: sticky
      top: 0

  .sidebar
    position: relative
    background: colvar('accent')
    // Buffer overlap on the top
    border-top: solid 1rem colvar('accent')
    margin-top: -1rem

  .content
    position: relative
    padding: 2rem 0

  // 404 / page not found
  .pgnf
    text-align: center

  .pgnf-blackbox
    background: black
    border-radius: 10px
    padding-top: 1rem
    padding-bottom: 2rem
    shadow-elevation(8px)

  .pgnf-header, .pgnf-text
    terminal-text()
    font-set('mono')

  .pgnf-header
    font-size: 5em

  .pgnf-text
    font-size: 2.5em

</style>

<!-- Non editor paths (basically we have two apps, one is edit, one isn't) -->
<Route>
  <div class=container role=presentation>
    <nav class=navbar use:navBarReveal aria-label=Navigation/>
    <aside class=sidebar use:sideBarReveal aria-label=Sidebar/>
    <main class="content" aria-label=Content>

        <!-- Home Page -->
      <Route path="/"><Page
        loading={API.withPage(ENV.HOMEPAGE).requestLocalized().then(({template}) => template)}
      /></Route>

      <!-- User Pages -->
      <Route path="/scp/*"><Page
          loading={API.withPage($router.path).requestLocalized().then(({template}) => template)}
      /></Route>

      <!-- Misc. routes-->
      <Route path="/test/md"><Page
          loading={fetch('/static/misc/md-test.md').then(res => res.text())}
      /></Route>

      <!-- 404 -->
      <Route fallback>
        <div class="pgnf rhythm" transition:fade={{duration: 50}}>
          <div class=pgnf-blackbox>
            <h1 class=pgnf-header>404</h1>
            <span class=pgnf-text>PAGE NOT FOUND</span>
          </div><br />
          <h4>The requested page either does not exist or was not found.</h4>
        </div>
      </Route>
    </main>
  </div>
</Route>