<script lang="ts">
  // Imports
  import { fade } from 'svelte/transition'
  import * as API from '@modules/api'
  import { sleep } from '@modules/util'
  // Components
  import Spinny from './Spinny.svelte'

  // Props
  export let path = ''

  // State
  const Page = new API.PageHandler(path, 'html')
  let loaded = false
  let html = ''

  // Wait until the HTML is ready (loading begins upon `PageHandler` instantiation )
  Page.targetReady.then(() => {
    html = Page.targetValue as string
    loaded = true
  })
</script>

<style lang="stylus">
  @require '_lib'

</style>

<template lang="pug">
  +if('loaded === true')
    div.rhythm(transition:fade='{{ delay: 100, duration: 250 }}' role='presentation') 
      +html('html')
    +else
      //- We'll wait a little bit so we don't needlessly show the loading spinner
      +await('sleep(300) then _')
        Spinny(
          width='150px' top='150px' left='50%',
          fadeIn='{{ duration: 100 }}',
          fadeOut='{{ duration: 100 }}'
        )
</template>
