<script lang="ts">
  // Imports
  import * as API from '@js/modules/api'
  import { sleep, throttle, waitFor } from '@modules/util'
  // Svelte
  import { usAnime } from '@js/modules/components'
  // Components
  import Spinny from './Spinny.svelte'
  import IntersectionPoint from './IntersectionPoint.svelte'
  import ActionsPanel from './ActionsPanel.svelte'

  // Props
  export let path = ''
  export let setHTML = ''

  // Animations
  const pageFadeIn = usAnime({
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

  // Constants
  const localPages = ['404']

  // State
  let ready = false
  let failed = false
  let error: any = {}
  let html = ''
  let hideActionsPanel = false

  const errorHandler = API.newErrorHandler({
    '404': () => {
      path = '404'
    },
    default: () => {
      failed = true
    }
  })

  // Fetch selected path
  async function fetchPage() {
    if (localPages.includes(path)) {
      // Local pages
      const response = await fetch(`/static/pages/${path}.html`)
      if (!response.ok) {
        failed = true
        error = new Error(response.statusText)
      } else {
        html = await response.text()
      }
    } else {
      // Remote pages
      try {
        // Init new page obj. with the target set to 'html'
        // This is to retrieve renderable content as soon as possible
        const Page = new API.PageHandler(path, 'html')
        // Wait for html to be ready and then set it
        await Page.targetReady
        html = Page.targetValue as string
      } catch (err) {
        // Display err msg if failed
        error = err
        errorHandler(API.getStatusCode(err))
      }
    }
    ready = true
    // After update stuff
    if (!failed) {
      // Highlight code blocks
      waitFor(() => typeof window.Prism?.highlightAll === 'function')
        .then(() => window.Prism.highlightAll())
    }
  }

  $: if (path && !setHTML) {
    ready = false, failed = false
    fetchPage()
  }

  $: if (setHTML) html = setHTML
</script>

{#if ready && !failed}
  <div class=rhythm use:pageFadeIn role=presentation>
    {@html html}
  </div>
  <IntersectionPoint
    onEnter={() => hideActionsPanel = true}
    onExit={() => hideActionsPanel = false}
    opts={{rootMargin: '300px'}}/>
  <ActionsPanel bind:hidden={hideActionsPanel}/>

  {:else if ready && failed}
  <div class=rhythm>
    <h2>Error Displaying Page</h2>
    <hr>
    <pre class=code><code>
      ERR: {error.name}: {error.message}
      MSG: {error.description}
    </code></pre>
  </div>

  {:else} {#await sleep(300) then _}
    <Spinny width=150px top=200px left=50%/>
  {/await}
{/if}
