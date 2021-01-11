<script lang="ts">
  // Imports
  import * as API from './modules/api'
  import { ENV, sleep } from './modules/util'
  import { tnAnime } from './modules/anime'
  import { Route, router } from 'tinro'
  import { fade } from 'svelte/transition'
  import '@iconify/iconify'
  import Sidebar from './components/Sidebar.svelte'
  import Page from './components/Page.svelte'
  import Spinny from './components/Spinny.svelte'

  // TODO: make a separate 404 page so that its indexed correctly
  // TODO: set page metadata

  const EditorURL = './Editor.js'

  // -- ANIMATIONS
  const sideBarReveal = {
    translateX: ['-100%', '0%'],
    duration: 600,
    easing: 'easeOutElastic(3, 2)',
    delay: 150
  }
  const navBarReveal = {
    scaleY: [0, 1],
    duration: 500,
    easing: 'easeOutElastic(2, 1.25)',
    delay: 50
  }

  let inEdit = false
  $: if ($router.path.startsWith('/edit')) inEdit = true
  $: document.documentElement.classList.toggle('in-edit', inEdit)

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
    box-shadow: 0 3px 5px rgba(0,0,0,0.5)
    transform-origin: top

    +match-media(thin, below)
      position: sticky
      top: 0

  .sidebar
    position: sticky
    top: -1rem
    height: calc(100vh + 1rem)
    background: colvar('accent-1')
    // Buffer overlap on the top
    border-top: solid 1rem colvar('accent-1')
    margin-top: -1rem

    +match-media(thin, below)
      display: none
      position: absolute
      top: 0
      left: -100%

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

<Route>
  {#if !inEdit}
    <div class=container out:fade={{duration: 100}} role=presentation>

      <nav class='navbar dark' in:tnAnime={navBarReveal} aria-label=Navigation/>
      <aside class='sidebar dark' in:tnAnime={sideBarReveal} aria-label=Sidebar>
        <Sidebar />
      </aside>

      <main class="content" aria-label=Content>
        <!-- Home Page -->
        <Route path="/"><Page
          loading={API.withPage(ENV.HOMEPAGE).requestLocalized().then(({template}) => template)}
        /></Route>

        <!-- User Pages -->
        <Route path="/scp/*"><Page
          loading={API.withPage($router.path).requestLocalized().then(({template}) => template)}
        /></Route>

        <!-- Test routes-->
        <Route path="/test/md"><Page
          loading={fetch('/static/misc/md-test.md').then(res => res.text())}
        /></Route>

        <Route path="/test/loading"><Page
          loading={new Promise(() => {})}
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
    {:else if $router.path.startsWith('/edit')}
    <!-- Async. load the editor -->
    <div
      out:fade={{ duration: 100, delay: 300 }}
      on:outroend={async () => { await sleep(50); inEdit = false }}
    >
      {#await import(EditorURL)}
        <Spinny width=150px top=50% left=50%/>
      {:then Editor}
        <svelte:component this={Editor.default}/>
      {/await}
    </div>
  {/if}
</Route>