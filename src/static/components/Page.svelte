<script lang="ts">
  // Imports
  import * as API from '@modules/api'
  import { sleep, waitFor } from '@modules/util'
  // Svelte
  import { beforeUpdate, afterUpdate, tick } from 'svelte'
  import { usAnime } from '@js/components'
  // Components
  import Spinny from './Spinny.svelte'

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

  // Misc.
  const errorHandler = API.newErrorHandler({
    '404': () => {
      path = '404'
    },
    default: () => {
      failed = true
    }
  })

  // Render selected path
  let lastPath = ''
  beforeUpdate(async () => {
    // Update if path isn't the same
    // If setHTML however, use that instead
    if (lastPath !== path && setHTML === '') {
      lastPath = path
      ready = false
      failed = false
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
          const code = API.getStatusCode(err)
          await tick()
          errorHandler(code)
        }
      }
    } else if (setHTML !== '') {
      html = setHTML
    }

    ready = true
  })

  afterUpdate(async () => {
    // Highlight code blocks on update
    await waitFor(() => typeof window.Prism?.highlightAll === 'function')
    window.Prism.highlightAll()
  })
</script>

<style lang="stylus">
  @require '_lib'

</style>

<template lang="pug">
  +if('ready === true')
    div.rhythm(use:pageFadeIn role='presentation') 
      +if('failed === false')
        +html('html')
        +else
          h2 Error displaying page
          hr
          pre.code: code.
            ERR: {error.name}: {error.message}
            MSG: {error.description}
    +else
      //- We'll wait a little bit so we don't needlessly show the loading spinner
      +await('sleep(300) then _')
        Spinny(width='150px' top='200px' left='50%')
</template>
