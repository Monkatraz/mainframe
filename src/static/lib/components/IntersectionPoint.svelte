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

<style lang='stylus'>
  .intersection-point
    height: 0
    width: 100%
</style>

<div class='intersection-point' bind:this={intersectionElement} role='presentation'/>