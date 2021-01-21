<script lang='ts'>
  import { renderMarkdown, morphMarkdown } from '../modules/markdown'
  import { createIdleQueued } from '../modules/util'
  import { createEventDispatcher, tick } from 'svelte'
  import { fade } from 'svelte/transition'

  const dispatch = createEventDispatcher()

  export let template = ''
  export let morph = false
  export let details = false
  export let activelines: Set<number> = new Set()

  export let heightmap: Map<number, number> = new Map()
  export let heightlist: number[] = []

  let container: HTMLElement

  const activeExclude = ['TBODY', 'THEAD', 'CODE']
  let activeElements: Set<Element> = new Set()

  function hasSiblings(elem: Element, ln: number) {
    if (!elem.parentElement) return false
    if (elem.parentElement.querySelectorAll(`:scope > [data-line="${ln}"]`).length === 1)
      return false
    return true
  }

  function getActiveElementStyle(target: Element) {
    if (!container || !target) return
    const parentRect = container.getBoundingClientRect()
    const rect = target.getBoundingClientRect()
    const style = window.getComputedStyle(target)
    const padding = [
      parseFloat(style.paddingTop),
      parseFloat(style.paddingBottom),
      parseFloat(style.paddingLeft),
      parseFloat(style.paddingRight)
    ]
    const height = rect.height - padding[0] - padding[1]
    const width = rect.width - padding[2] - padding[3]
    const offsetTop = rect.top - parentRect.top + padding[0] + padding[1]
    const offsetLeft = rect.left - parentRect.left + padding[2] + padding[3]
    return `height: ${height}px; width: ${width}px; top: ${offsetTop}px; left: ${offsetLeft}px;`
  }

  function updateActiveElements() {
    if (!container) return
    activeElements.clear()
    for (let ln of activelines) {
      // find matches
      let elems = container.querySelectorAll(`[data-line="${ln}"]`)
      // no match on this line? hunt for the first line number that maches
      while (!elems.length && ln >= 0) {
        ln--
        elems = container.querySelectorAll(`[data-line="${ln}"]`)
      }
      // last node that matches
      let elem = elems[elems.length - 1]
      if (!elem) continue

      // if our direct match has no siblings, highlight it
      if (!activeExclude.includes(elem.tagName) && !hasSiblings(elem, ln))
        activeElements.add(elem)
      // else, use first ancestor that has no siblings of the same line number
      else while(elem.parentElement && elem.parentElement !== container) {
        elem = elem.parentElement
        if (!activeExclude.includes(elem.tagName) && !hasSiblings(elem, ln)) {
          activeElements.add(elem)
          break
        }
      }
      // add last ancestor to match
      while(elem.parentElement && elem.parentElement !== container)
        elem = elem.parentElement
      if (elem.parentElement && !activeExclude.includes(elem.tagName))
        activeElements.add(elem)
    }
    // inform svelte of the value change
    activeElements = activeElements
  }

  function updateHeightMap() {
    if (!container) return
    heightmap.clear()
    heightlist = []
    const parentRect = container.getBoundingClientRect()
    container.querySelectorAll<HTMLElement>('[data-line]').forEach(elem => {
      if (elem.offsetParent === container) {
        const line = parseInt(elem.getAttribute('data-line')!)
        const height = elem.getBoundingClientRect().top - parentRect.top
        heightmap.set(line, height)
        heightlist[line] = height
      }
    })
  }

  const update = createIdleQueued(async () => {
    if (!container) return
    if (morph) await morphMarkdown(template, container)
    else container.innerHTML = (await renderMarkdown(template)).html
    if (details) {
      await tick()
      updateHeightMap()
      updateActiveElements()
    }
    dispatch('postrender')
  })

  $: if (template) update()
  $: if (details && activelines) updateActiveElements()

</script>

<style lang='stylus'>
  @require '_lib'

  .wrap
    contain: content

  .active-element
    position: absolute
    box-shadow: 0 0 1rem 0.25rem colvar('text-select', opacity 0.075)
    border-radius: 0.25rem
    background: colvar('text-select', opacity 0.075)
    pointer-events: none
    user-select: none
    z-index: 1

</style>

<div class='wrap' role='presentation'>
  {#each Array.from(activeElements) as elem (elem)}
    <div class=active-element transition:fade={{duration: 100}} style={getActiveElementStyle(elem)} />
  {/each}
  <div bind:this={container} class='rhythm container' role=presentation />
</div>