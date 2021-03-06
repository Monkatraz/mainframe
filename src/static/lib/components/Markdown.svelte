<script lang='ts'>
  import { Markdown } from '../modules/workers'
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

  let isFirstRender = true

  const activeExclude = ['TBODY', 'THEAD', 'CODE']
  let activeElements: Element[] = []

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
    const active = new Set<Element>()
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
        active.add(elem)
      // else, use first ancestor that has no siblings of the same line number
      else while (elem.parentElement && elem.parentElement !== container) {
        elem = elem.parentElement
        if (!activeExclude.includes(elem.tagName) && !hasSiblings(elem, ln)) {
          active.add(elem)
          break
        }
      }
      // add last ancestor to match
      while (elem.parentElement && elem.parentElement !== container)
        elem = elem.parentElement
      if (elem.parentElement && !activeExclude.includes(elem.tagName))
        active.add(elem)
    }
    // inform svelte of the value change
    activeElements = Array.from(active)
  }

  function updateHeightMap() {
    if (!container) return
    heightmap.clear()
    heightlist = []
    const parentRect = container.getBoundingClientRect()
    container.querySelectorAll<HTMLElement>('[data-line]').forEach((elem) => {
      if (elem.parentElement === container) {
        const line = parseInt(elem.getAttribute('data-line')!)
        const height = elem.getBoundingClientRect().top - parentRect.top
        heightmap.set(line, height)
        heightlist[line] = height
      }
    })
  }

  const update = createIdleQueued(async () => {
    if (!container) return
    if (morph) await Markdown.morphNode(template, container)
    else container.innerHTML = await Markdown.render(template)
    if (details) {
      await tick()
      updateHeightMap()
      updateActiveElements()
    }
    if (isFirstRender) dispatch('firstrender')
    dispatch('postrender')
    isFirstRender = false
  })

  $: if (template) update()
  $: if (details && activelines) updateActiveElements()

</script>

<div class='md-wrap' role='presentation'>
  {#each activeElements as elem (elem)}
    <div class=active-element transition:fade={{ duration: 100 }} style={getActiveElementStyle(elem)} />
  {/each}
  <div bind:this={container} class:hidden={isFirstRender} class='rhythm md-container' role='presentation' />
</div>

<style lang='stylus'>
  @require '_lib'

  .md-wrap
    contain: content

  .active-element
    position: absolute
    z-index: 1
    background: colvar('text-select', opacity 0.075)
    border-radius: 0.25rem
    box-shadow: 0 0 1rem 0.25rem colvar('text-select', opacity 0.075)
    user-select: none
    pointer-events: none

  .md-container
    opacity: 1
    transition: opacity 0.1s ease-out

    &.hidden
      opacity: 0

</style>
