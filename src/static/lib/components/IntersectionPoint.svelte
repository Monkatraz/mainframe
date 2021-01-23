<script lang='ts'>
  import { onMount } from 'svelte'

  // Props
  export let onEnter: AnyFn = () => undefined
  export let onExit: AnyFn = () => undefined
  export let opts: IntersectionObserverInit = {}

  // Elements
  let intersectionElement: HTMLElement

  // Intersection Observer and Handler
  function handler(entry: IntersectionObserverEntry) {
    const isVisible = Math.round(entry.intersectionRatio)
    if (isVisible) onEnter(); else onExit()
  }

  const observer = new IntersectionObserver(([entry]) => { handler(entry) }, opts)

  onMount(() => {
    observer.observe(intersectionElement)
  })

</script>

<div class='intersection-point' bind:this={intersectionElement} role='presentation'/>

<style lang='stylus'>
  .intersection-point
    width: 100%
    height: 0
</style>
