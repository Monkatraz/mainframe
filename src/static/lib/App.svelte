<script lang="ts">
  // Imports
  import * as API from './modules/api'
  import { ENV, sleep } from './modules/util'
  import { tnAnime } from './modules/anime'
  import { Route, router } from 'tinro'
  import { fade } from 'svelte/transition'
  import Iconify from '@iconify/iconify'
  import Sidebar from './components/sidebar/Sidebar.svelte'
  import Page from './components/Page.svelte'
  import Spinny from './components/Spinny.svelte'

  // chores on init

  // adds a Iconify SCP outline logo
  Iconify.addIcon('@c:scp:logo', {
    body:
      `<g shape-rendering="geometricPrecision" fill="currentColor" stroke="currentColor" stroke-width="5">
        <path d="M795 610a260 260 0 00-170-294l-8-57H463l-8 57-10 3a260 260 0 00-160 291l-45 36 77 133 53-21a260 260 0 00340 0l53 21 77-133zm-45 130l-47-18-7 7a229 229 0 01-312 0l-7-7-47 18-50-87 39-31-2-9a229 229 0 01139-265l17-5 10-3 7-50h100l7 50 10 3a229 229 0 01156 270l-2 9 39 31z"/>
        <path d="M407 560c0-68 51-124 117-132v36h-23l39 67 39-67h-23v-68a163 163 0 00-32 0c-83 8-149 79-149 164a164 164 0 008 51l28-16a133 133 0 01-4-35z"/>
        <path d="M540 694a133 133 0 01-107-54l30-17 12 20 39-67h-78l12 20-30 18-27 15a164 164 0 00271 42l-28-16a133 133 0 01-94 39z"/>
        <path d="M575 399v32c57 16 98 68 98 129a133 133 0 01-11 54l-30-18 12-20h-78l39 67 12-20 30 17 27 16a164 164 0 0031-96c0-78-56-145-130-161z"/>
      </g>`,
    top: 224,
    left: 224,
    width: 632,
    height: 632
  })

  // TODO: make a separate 404 page so that its indexed correctly
  // TODO: set page metadata

  // kind of hacky, but we don't want esbuild to preload the entire editor
  // so we use a dynamic import string
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

  // Shorthands
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

</style>

{#if $router.path === '/edit'}
  <!-- Editor -->
  <div
  out:fade={{ duration: 100, delay: 300 }}
  on:outroend={async () => { await sleep(50); inEdit = false }}
  >
  <!-- Async. loading -->
    {#await import(EditorURL)}
      <Spinny width=150px top=50% left=50%/>
    {:then Editor}
      <svelte:component this={Editor.default}/>
    {/await}
  </div>
{:else if !inEdit}
  <div class=container out:fade={{duration: 150}} role=presentation>

    <nav class='navbar dark' in:tnAnime={navBarReveal} aria-label=Navigation/>
    <aside class='sidebar dark' in:tnAnime={sideBarReveal} aria-label=Sidebar>
      <Sidebar />
    </aside>

    <main class="content" aria-label=Content>
      {#key $router.path}
        <Route firstmatch>
          <!-- Dummy route for the editor -->
          <Route path='/edit'/>

          <!-- Home Page -->
          <Route path="/"><Page
            loading={API.withPage(ENV.HOMEPAGE).requestLocalized().then(({template}) => template)}
          /></Route>

          <!-- Test routes-->
          <Route path="/test/md"><Page
            loading={fetch('/static/misc/md-test.md').then(res => res.text())}
          /></Route>

          <Route path="/test/loading"><Page
            loading={new Promise(() => {})}
          /></Route>

          <!-- User Pages -->
          <Route path="/*"><Page
            loading={API.withPage($router.path).requestLocalized().then(({template}) => template)}
          /></Route>
        </Route>
      {/key}
    </main>
  </div>
{/if}