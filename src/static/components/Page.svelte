<script lang='ts'>
  import { sleep } from '@modules/util'
  import { tnAnime, load } from '@modules/components'
  import { renderMarkdown, Prism } from '@modules/markdown'
  import { fade } from 'svelte/transition'
  import Spinny from './Spinny.svelte'
  import IntersectionPoint from './IntersectionPoint.svelte'
  import ActionsPanel from './ActionsPanel.svelte'

  export let loading: Promise<string>

  let hideActionsPanel = true

  const pageReveal = {
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
  }
</script>

<div role=presentation out:fade={{duration: 100}}>
  {#await loading.then(renderMarkdown)}
  <!-- Delayed Loading Spinner -->
    {#await sleep(300) then _}
      <Spinny width=150px top=200px left=50%/>
    {/await}

  <!-- Page loaded -->
  {:then html }
    <div class=rhythm role=presentation
      in:tnAnime={pageReveal} use:load={Prism.highlightAllUnder}
    >
      {@html html}
    </div>

    <IntersectionPoint
      onEnter={() => hideActionsPanel = true}
      onExit={() => hideActionsPanel = false}
      opts={{rootMargin: '300px'}}/>
    <ActionsPanel bind:hidden={hideActionsPanel}/>

  <!-- Page failed to load -->
  {:catch error}
    <div class=rhythm in:tnAnime={pageReveal}>
      <h2>Error Displaying Page</h2>
      <hr>
      <pre class=code><code>
        ERR: {error?.name}: {error?.message}
        MSG: {error?.description}
      </code></pre>
    </div>
  {/await}
</div>