<script lang='ts'>
  import { getStatusCode } from '../modules/api'
  import { renderMarkdown } from '../modules/markdown'
  import { fade } from 'svelte/transition'
  import { tnAnime, Spinny } from '@components'

  export let loading: Promise<string>

  const pageReveal = {
    opacity: {
      value: [0, 1],
      duration: 300,
      easing: 'easeOutQuad',
      delay: 100
    },
    translateY: {
      value: ['-4rem', '0rem'],
      duration: 800,
      easing: 'easeOutElastic(2, 2)'
    }
  }
</script>

<div role='presentation' out:fade={{ duration: 100 }}>
  {#await loading.then(renderMarkdown)}

    <Spinny width=150px top=200px left=50%/>

  <!-- Page loaded -->
  {:then { html } }
    <div class='rhythm' role='presentation' in:tnAnime={pageReveal}>
      {@html html}
    </div>

  <!-- Page failed to load -->
  {:catch error}
    {#if getStatusCode(error) === 404 }
      <div class="pgnf rhythm" in:tnAnime={pageReveal}>
        <div class='pgnf-blackbox'>
          <h1 class='pgnf-header'>404</h1>
          <span class='pgnf-text'>PAGE NOT FOUND</span>
        </div><br />
        <h4>The requested page either does not exist or was not found.</h4>
      </div>
    {:else}
      <div class='rhythm' in:tnAnime={pageReveal}>
        <h2>Error Displaying Page</h2>
        <hr>
        <pre class='code'><code>
ERR: {error?.name}: {error?.message}
MSG: {error?.description}
        </code></pre>
      </div>
    {/if}
  {/await}
</div>

<style lang='stylus'>
  @require '_lib'

  // 404 / page not found
  .pgnf
    text-align: center

  .pgnf-blackbox
    padding-top: 1rem
    padding-bottom: 2rem
    background: black
    border-radius: 10px
    shadow-elevation(8px)

  .pgnf-header, .pgnf-text
    terminal-text()
    font-set('mono')

  .pgnf-header
    font-size: 5em

  .pgnf-text
    font-size: 2.5em
</style>
