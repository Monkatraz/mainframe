<script lang='ts'>
  import { FTML } from '../modules/workers'
  import { createIdleQueued, perfy } from '../modules/util'
  import { createEventDispatcher } from 'svelte'
  import { Card } from '@components'
  import morphdom from 'morphdom'

  const dispatch = createEventDispatcher()

  export let template = ''
  export let morph = false

  let container: HTMLElement
  let isFirstRender = true
  let perf = 0

  const update = createIdleQueued(async () => {
    const getPerf = perfy()
    try {
      const html = await FTML.render(template)
      if (morph) {
        morphdom(container, html, {
          childrenOnly: true,
          onBeforeElUpdated: function (fromEl, toEl) {
            if (fromEl.isEqualNode(toEl)) return false
            return true
          }
        })
      } else {
        container.innerHTML = html
      }
      if (isFirstRender) dispatch('firstrender')
      dispatch('postrender')
      isFirstRender = false
      perf = getPerf()
    } catch {
      if (container) {
        container.innerText = 'Failed to render'
        isFirstRender = false
      }
    }
  })

  $: if (container && template) update()

</script>

<div class='ftml-wrap' role='presentation'>
  <div class='ftml-perf-card'>
    <Card>
      <span class='ftml-perf-text'>PERF: {Math.round(perf)}ms</span>
    </Card>
  </div>
  <div bind:this={container} class:hidden={isFirstRender} class='rhythm ftml-container' role='presentation' />
</div>

<style lang='stylus'>
  @require '_lib'

  .ftml-wrap
    contain: content
    height: 100%

  .ftml-perf-card
    position: absolute
    top: 0
    right: 2rem

  .ftml-perf-text
    font-size: 0.8rem

  .ftml-container
    opacity: 1
    transition: opacity 0.1s ease-out

    &.hidden
      opacity: 0

</style>
