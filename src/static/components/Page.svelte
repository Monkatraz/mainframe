<script lang="ts">
  // Imports
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

      // Get the available languages in our document
      const langs = locals._fields
      // Default language selection is the first in the list
      let lang = langs[0]
      // Get every language that is within both lists
      const intersect = langs.filter((lang) => API.User.preferences.langs.includes(lang))
      // Use first matching language
      if (intersect.length > 0) lang = intersect[0]

      // Now we get our view with the actual data we need in it
      const view = await locals._getLazy(lang)
      // We'll pick out the HTML string on FaunaDB's end to save on requests
      html = await view._query((expr) => q.Select('html', q.Select('root', expr))) as string
      loaded = true

      // const view = await locals[lang]
      // html = view.root.html
      // loaded = true
    }
  })
</script>

<style lang="stylus">
  @require '_lib'

</style>

<template lang="pug">
  +if('loaded === true')
    div.rhythm #[+html('html')]
</template>
