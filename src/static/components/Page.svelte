<script lang="ts">
  // Imports
  import { fade } from 'svelte/transition'
  import * as API from '@modules/api'
  const q = API.q

  // Props
  export let path = ''

  // Set up a few state variables
  let failed = false
  let loaded = false
  let html = ''

  // Get and parse document
  API.requestLazy(path).then(async (response) => {
    if (!response.ok) failed = true
    else {
      const document = response.body
      // Load some of the things we'll need
      const locals = await document._getLazy('locals')

      // TODO: Speculatively attempt to fetch the desired language

      // Get the available languages in our document
      const langs = locals._fields
      // Default language selection is the first in the list
      let lang = langs[0]
      // Get every language that is within both lists
      const intersect = langs.filter((lang) => API.User.preferences.langs.includes(lang))
      // Use first matching language
      if (intersect.length > 0) lang = intersect[0]

      // We'll pick out the HTML string on FaunaDB's end for reduced latency
      html = await locals._query<string>((expr) => q.Select('html', q.Select('root', q.Select(lang, expr))))
      loaded = true

      // const view = await locals[lang]
      // html = view.root.html
      // loaded = true
    }
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
