<script lang="ts">
  // Imports
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import * as API from '@modules/api'
  const q = API.q

  // Props
  export let path = ''
  
  // State
  const Page = new API.PageHandler(path)
  let loaded = false
  let html = ''

  // Init Page handler as quickly as possible
  onMount(() => {
    Page.init().then(result => {
      if (!result.ok) throw new Error()
      html = result.body
      loaded = true
    })
  })
</script>

<style lang="stylus">
  @require '_lib'
  .fetchspinny
    z-index: 70
    top: center
    left: center
    height: 100%
    width: 100%
    background-image: url('/static/media/spinner.svg')
    background-repeat: no-repeat
    background-position: 50% 250px
    background-size: 200px

</style>

<template lang="pug">
  +if('loaded === true')
    div(transition:fade='{{ delay: 100, duration: 250 }}' role='presentation').page.rhythm #[+html('html')]
    +else
      div(transition:fade='{{ duration: 100 }}' role='presentation').fetchspinny
</template>
