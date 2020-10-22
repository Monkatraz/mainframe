<script lang="ts">
  // Imports
  import * as API from '@modules/api'
  import { sleep, waitFor } from '@modules/util'
  // Svelte
  import { beforeUpdate, afterUpdate } from 'svelte'
  import { fade } from 'svelte/transition'
  import Spinny from './Spinny.svelte'

  // Props
  export let path = ''
  export let setHTML = ''

  // State
  let ready = false
  let html = ''

  // Render selected path
  let lastPath = ''
  beforeUpdate(async () => {
    // Update if path isn't the same
    // If setHTML however, use that instead
    if (lastPath !== path && setHTML === '') {
      lastPath = path
      ready = false
      // Init new page obj. with the target set to 'html'
      // This is to retrieve renderable content as soon as possible
      const Page = new API.PageHandler(path, 'html')
      // Wait for html to be ready and then set it
      await Page.targetReady
      html = Page.targetValue as string
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
    div.rhythm(transition:fade='{{ delay: 100, duration: 250 }}' role='presentation') 
      +html('html')
    +else
      //- We'll wait a little bit so we don't needlessly show the loading spinner
      +await('sleep(300) then _')
        Spinny(width='150px' top='150px' left='50%')
</template>
