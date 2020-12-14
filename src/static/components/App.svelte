<script lang="ts">
  // Imports
  import * as API from '@js/modules/api'
  import { ENV } from '@modules/state'
  import { sleep, waitFor } from '@modules/util'
  import { usAnime, load } from '@modules/components'
  import { fade } from 'svelte/transition'
  import { generateRenderer, Prism } from '@modules/markdown'
  import router from 'page'
  // Components
  import Spinny from './Spinny.svelte'
  import IntersectionPoint from './IntersectionPoint.svelte'
  import ActionsPanel from './ActionsPanel.svelte'

  // -- STATE
  let mode: 'LOADING' | 'VIEW' | 'EDIT' | 'ERROR' | '404' = 'LOADING'
  let page: API.LocalizedPage
  let html: string
  let error: any
  let hideActionsPanel = true

  // -- ANIMATIONS
  const sideBarReveal = usAnime({
    translateX: ['-100%', '0%'],
    duration: 400,
    easing: 'easeOutElastic(3, 2)',
    delay: 50
  })
  const navBarReveal = usAnime({
    scaleY: [0, 1],
    duration: 200,
    easing: 'easeOutElastic(2, 1.25)'
  })
  const pageReveal = usAnime({
    opacity: {
      value: [0, 1],
      duration: 300,
      easing: 'easeOutQuad',
      delay: 50
    },
    translateY: {
      value: ['-4rem', '0rem'],
      duration: 800,
      easing: 'easeOutElastic(2, 2)'
    },
  })

  // -- MISC
  const renderMarkdown = generateRenderer()

  // -- ROUTER
  // Test pages
  router('/404', () => mode = '404') // Directly asking for 404
  router('/test/load', () => mode = 'LOADING') // Loading symbol test page
  router('/test/md', loadTestPage) // Markdown test page
  // Proper pages
  router('/', () => loadPath(ENV.HOMEPAGE)) // Home page
  router((ctx) => loadPath(ctx.pathname)) // Everything else
  // Start router
  router()

  async function loadTestPage() {
    mode = 'LOADING'
    const response = await fetch('/static/misc/md-test.md')
    html = renderMarkdown(await response.text())
    mode = 'VIEW'
  }

  async function loadPath(path: string) {
    try {
      // Begin loading page, jump to `catch (err)` below if it fails
      mode = 'LOADING'
      const response = await API.withPage(path).requestLocalized()
      if (!response.ok) throw response.body
      // Page loaded successfully
      page = response.body
      html = renderMarkdown(page.template)
      mode = 'VIEW'
    } catch (err) {
      error = err
      if (API.getStatusCode(err) === 404) mode = '404'
      else mode = 'ERROR'
    }
  }
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
    padding: 2rem 0
    shadow-elevation(8px)

  .pgnf-header, .pgnf-text
    terminal-text()
    font-set('mono')

  .pgnf-header
    font-size: 5rem

</style>

{#if mode !== 'EDIT'}
  <div class=container role=presentation>
    <nav class=navbar use:navBarReveal aria-label=Navigation/>
    <aside class=sidebar use:sideBarReveal aria-label=Sidebar/>
    <main class=content aria-label=Content>
      {#key mode}
        {#if mode === 'VIEW'}
          <!-- Page successfully loaded -->
            <div class=rhythm
              use:pageReveal out:fade={{duration: 50}} role=presentation
              use:load={Prism.highlightAllUnder}
              >
              {@html html}
            </div>
            <!-- Actions Panel -->
            <IntersectionPoint
            onEnter={() => hideActionsPanel = true}
            onExit={() => hideActionsPanel = false}
            opts={{rootMargin: '300px'}}/>
            <ActionsPanel bind:hidden={hideActionsPanel}/>

          <!-- Every other mode folllows -->

          <!-- Page still loading -->
          {:else if mode === 'LOADING'}
          <!-- Wait a moment before loading so that we don't instantly and needlessly display a spinner -->
          {#await sleep(300) then _}
            <Spinny width=150px top=200px left=50%/>
          {/await}

          <!-- Page not found / 404 error-->
          {:else if mode === '404'}
          <div class="pgnf rhythm" use:pageReveal out:fade={{duration: 50}}>
            <div class="pgnf-blackbox rhythm">
              <h1 class=pgnf-header>404</h1>
              <h2 class=pgnf-text>PAGE NOT FOUND</h2>
            </div><br />
            <h5>The requested page either does not exist or was not found.</h5>
          </div>

          <!-- Page display error -->
          {:else if mode === 'ERROR'}
          <div class=rhythm use:pageReveal out:fade={{duration: 50}}>
            <h2>Error Displaying Page</h2>
            <hr>
            <pre class=code><code>
              ERR: {error.name}: {error.message}
              MSG: {error.description}
            </code></pre>
          </div>
        {/if}
      {/key}
    </main>
  </div>
{/if}