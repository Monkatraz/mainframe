<script lang="ts">
  // Imports
  import * as API from '@modules/api'
  import { sleep, throttle, waitFor } from '@modules/util'
  // Svelte
  import { usAnime } from '@js/components'
  // Components
  import Spinny from './Spinny.svelte'
  import IntersectionPoint from './IntersectionPoint.svelte'
  import ActionsPanel from './ActionsPanel.svelte'

  // Props
  export let path = ''
  export let setHTML = ''

  // Animations
  const pageFadeIn = usAnime({
    opacity: [0, 1],
    duration: 500,
    easing: 'easeOutQuad'
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
      await waitFor(() => typeof window.Prism?.highlightAll === 'function')
      window.Prism.highlightAll()
    }
  }

  $: if (path && !setHTML) {
    ready = false, failed = false
    fetchPage()
  }

  $: if (setHTML) html = setHTML
</script>

<template lang="pug">

  +if("ready === true")
    div.rhythm(use:pageFadeIn role='presentation')
      +if('failed === false'): +html('html')
        +else
          h2 Error displaying page
          hr
          pre.code: code.
            ERR: {error.name}: {error.message}
            MSG: {error.description}

    IntersectionPoint(
      onEnter!='{() =>  hideActionsPanel = true}'
      onExit!='{() => hideActionsPanel = false}'
      opts!='{{rootMargin: "300px"}}')

    ActionsPanel(bind:hidden!='{hideActionsPanel}')

    //- We'll wait a little bit so we don't needlessly show the loading spinner
    +else: +await('sleep(300) then _')
        Spinny(width='150px' top='200px' left='50%')

</template>
