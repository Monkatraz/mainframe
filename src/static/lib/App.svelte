<script lang='ts'>
  // Imports
  import * as API from './modules/api'
  import { Route, router } from 'tinro'
  import { fade } from 'svelte/transition'
  import { onMount } from 'svelte'
  import {
    portal, tnAnime, matchMedia, ENV,
    Transition, Navbar, Sidebar, Page, Spinny, UserPanel, Toasts, DevPage
  } from '@components'

  // kind of hacky, but we don't want esbuild to preload the entire editor
  // so we use a dynamic import string
  const EditorURL = './components/editor/Editor.svelte.js'

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

  let transitionState: boolean
  $: document.documentElement.classList.toggle('in-edit', transitionState)

  onMount(() => {
    document.documentElement.classList.add('loaded')
  })

</script>

<!-- User Panel (large screen, not in navbar) -->
{#if $matchMedia('small', 'up')}
  <div role='presentation' use:portal={'#user-panel'}>
    <UserPanel />
  </div>
{/if}

<!-- Toasts -->
<div role='presentation' use:portal={'#toasts'}>
  <Toasts />
</div>

<Transition condition={$router.path === '/edit'} bind:state={transitionState}>
  <slot slot='true'>
    <!-- Editor -->
    <div out:fade={{ duration: 100, delay: 300 }}>
      {#await import(EditorURL).catch()}
        <Spinny width=150px top=50% left=50%/>
      {:then Editor}
        <svelte:component this={Editor.default}/>
      {/await}
    </div>
  </slot>
  <slot slot='false'>
    <div class=container out:fade={{ duration: 150 }} role=presentation>

      <nav class='navbar dark' in:tnAnime={navBarReveal} aria-label=Navigation>
        <Navbar />
      </nav>
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
              loading={API.withPage(ENV.HOMEPAGE).requestLocalized().then(({ template }) => template)}
            /></Route>

            <!-- Test routes-->
            <Route path="/test/md"><Page
              loading={fetch('/static/misc/md-test.md').then(res => res.text())}
            /></Route>

            <Route path="/test/components">
              <DevPage />
            </Route>

            <Route path="/test/loading"><Page
              loading={new Promise(() => {})}
            /></Route>

            <!-- User Pages -->
            <Route path="/*"><Page
              loading={API.withPage($router.path).requestLocalized().then(({ template }) => template)}
            /></Route>
          </Route>
        {/key}
      </main>
    </div>
  </slot>
</Transition>

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
    margin-top: -1rem
    background: colvar('accent-1')
    // Buffer overlap on the top
    border-top: solid 1rem colvar('accent-1')

    +match-media(thin, below)
      position: absolute
      top: 0
      left: -100%
      height: 100%

  .content
    position: relative
    padding: 1rem 0

</style>
