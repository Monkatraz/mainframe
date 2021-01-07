<script lang="ts">
  // Library Imports
  import { onDestroy, onMount } from 'svelte'
  import { spring } from 'svelte/motion'
  import { morphMarkdown } from '@modules/markdown'
  import { tnAnime } from '@modules/anime'
  import { idleCallback, createIdleQueued, createAnimQueued, throttle } from '@modules/util'
  // CodeMirror
  import { EditorState, EditorView, getExtensions } from './editor-config'
  // Components
  // import Spinny from '../components/Spinny.svelte'

  // -- CONTAINER

  let containerClass: 'show-editor' | 'show-both' | 'show-preview' = 'show-both'
  let showLivePreview = true

  $: containerClass = showLivePreview ? 'show-both' : 'show-editor'
  $: if (preview) updatePreview()

  // -- EDITOR

  let editorContainer: HTMLElement
  let editorView: EditorView

  onMount(async () => {

    const mergedExtensions = [
      EditorView.domEventHandlers({
        'keydown': () => { updateHTML() },
        'wheel': () => { scrollingWith = 'editor' },
        'scroll': () => { scrollFromEditor() }
      }),
      await getExtensions()
    ]

    editorView = new EditorView({
      state: EditorState.create({
        doc: await fetch('/static/misc/md-test.md').then(res => res.text()),
        extensions: mergedExtensions
      }),
      parent: editorContainer
    })

    updatePreview()

  })

  onDestroy(() => { editorView.destroy() })

  // -- PREVIEW <-> EDITOR

  let preview: HTMLDivElement
  let previewContainer: HTMLElement

  let perf = 0
  let cacheSize = 0

  // Scroll Sync.
  let scrollMapNeedsUpdate = true
  let arrLineHeight: number[] = []
  let mapLineHeight: Map<number, number> = new Map()
  /** Denotes whether the editor or the preview is the element the user is scrolling with. */
  let scrollingWith: 'editor' | 'preview' = 'editor'
  /** The spring for the preview's sync. scroll position. */
  let previewScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })
  /** The spring for the editor's sync. scroll position. */
  let editorScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })

  /** Generally updates the preview's state, such as the rendered HTML and the scroll map. */
  const updatePreview = throttle(() => {
    updateHTML()
    updateScrollMap()
    scrollFromEditor()
    scrollFromPreview()
  }, 100)

  /** Returns the scrollTop height of the specified line. */
  function heightAtLine (line: number) {
    return editorView.visualLineAt(editorView.state.doc.line(line).from).top
  }

  /** Updates the preview's HTML based on the current editor state. */
  const updateHTML = createIdleQueued(async () => {
    if (!preview || !editorView) return
    const startPerf = performance.now()
    // rather than replace the whole tree we just replace what's changed using MorphDOM
    await idleCallback(async () => {
      const stats = await morphMarkdown(editorView.state.doc.toString(), preview)
      scrollMapNeedsUpdate = true
      cacheSize = stats.cacheSize
      perf = performance.now() - startPerf
    })
  })

  /** Updates the scroll map that is used for scroll syncing between the editor and preview. */
  const updateScrollMap = createAnimQueued(() => {
    if (!preview || !editorView) return
    scrollMapNeedsUpdate = false
    const previewRect = preview.getBoundingClientRect()
    // here we map every [data-line] element's line to its offset scroll height
    // we also make a array version of the same Map, for usage with iterators
    mapLineHeight.clear()
    arrLineHeight = []
    Array.from(preview.querySelectorAll<HTMLElement>('[data-line]'))
      .forEach(elem => {
        const dataLine = parseInt(elem.getAttribute('data-line') as string)
        if (elem.offsetParent === preview) {
        const height = elem.getBoundingClientRect().top - previewRect.top
        mapLineHeight.set(dataLine, height)
        arrLineHeight[dataLine] = height
        }
      })

    // starts a poll (because it calls itself) to catch flukes
    setTimeout(updateScrollMap, 5000)
  })

  /** Updates the preview scroll position if the scroll sync. is currently editor based.
   *  Should be called whenever a scrolling event is detected from the editor. */
  const scrollFromEditor = createAnimQueued(() => {
    if (scrollingWith === 'preview' || !preview || !editorView) return
    if (scrollMapNeedsUpdate) updateScrollMap()
    const scrollTop = editorView.scrollDOM.scrollTop
    editorScrollSpring.set(scrollTop)
    // get top most visible line
    const domRect = editorContainer.getBoundingClientRect()
    const pos = editorView.posAtCoords({ x: domRect.x, y: domRect.y })
    let line =
    editorView.state.doc.lineAt(pos ?? 1).number
    // find our line height
    let lineHeight = 0
    let curLine = line
    // check if we have our line or not
    if (mapLineHeight.has(line)) lineHeight = mapLineHeight.get(line) as number
    // no? get closest line before this one
    else for (;curLine > 0; curLine--) if (mapLineHeight.has(curLine)) {
      lineHeight = mapLineHeight.get(curLine) as number
      break
    }
    // set preview scroll
    if (lineHeight) {
      // fudge value to prevent the preview from getting "sticky"
      const diff = (scrollTop - heightAtLine(curLine)) * 0.75
      previewScrollSpring.set(lineHeight + diff)
    }
  })

  /** Updates the editor scroll position if the scroll sync. is currently preview based.
   *  Should be called whenever a scrolling event is detected from the preview. */
  const scrollFromPreview = createAnimQueued(() => {
    if (scrollingWith === 'editor' || !preview || !editorView) return
    if (scrollMapNeedsUpdate) updateScrollMap()
    const scrollTop = previewContainer.scrollTop
    previewScrollSpring.set(scrollTop)
    // filter for the closest line height
    const line = arrLineHeight.findIndex(height => scrollTop < height)
    if (line !== -1) {
      // fudge to prevent the editor from getting sticky
      const diff = (scrollTop - arrLineHeight[line]) * 0.75
      editorScrollSpring.set(heightAtLine(line) + diff)
    }
  })

  // updates scroll sync. positions
  $: if (previewContainer && scrollingWith === 'editor') previewContainer.scrollTop = $previewScrollSpring
  $: if (editorView && scrollingWith === 'preview') editorView.scrollDOM.scrollTop = $editorScrollSpring

</script>

<style lang="stylus">
  @require '_lib'

  $hght = calc(100vh - var(--layout-header-height))
  $hght2 = calc(100vh - 2rem - var(--layout-header-height))
  $body-w = minmax(0, var(--layout-body-max-width))
  $edit-w = minmax(50%, 1fr)

  .overflow-container
    position: relative
    height: $hght
    width: 100%
    overflow: hidden
    background: #23272E

  .editor-container
    width: 100%
    box-shadow: 0 0 4rem black

    &.show-both
      grid-kiss:"+--------------------------------------------------+      ",
                "| .topbar                                          | 2rem ",
                "+--------------------------------------------------+      ",
                "+---------------+ +------+ +--------------+ +------+      ",
                "| .editor       | |      | | .preview     | |      |      ",
                "|               | |      | |              | |      |      ",
                "|               | |      | |              | |      |      ",
                "|               | |      | |              | |      |      ",
                "|               | |      | |              | |      |$hght2",
                "|               | |      | |              | |      |      ",
                "|               | |      | |              | |      |      ",
                "|               | |      | |              | |      |      ",
                "|               | |      | |              | |      |      ",
                "|               | |      | |              | |      |      ",
                "+---------------+ +------+ +--------------+ +------+      ",
                "|    $edit-w    | |0.5rem| |   $body-w    | |0.5rem|      "

    &.show-editor
      grid-kiss:"+--------------------------------------------------+      ",
                "| .topbar                                          | 2rem ",
                "+--------------------------------------------------+      ",
                "+--------------------------------------------------+      ",
                "| .editor                                          |      ",
                "|                                                  |      ",
                "|                                                  |      ",
                "|                                                  |      ",
                "|                                                  |$hght2",
                "|                                                  |      ",
                "|                                                  |      ",
                "|                                                  |      ",
                "|                                                  |      ",
                "|                                                  |      ",
                "+--------------------------------------------------+      ",
                "| 100%                                             |      "

    &.show-preview
      grid-kiss:"+--------------------------------------------------+      ",
                "| .topbar                                          | 2rem ",
                "+--------------------------------------------------+      ",
                "+------+ +--------------------------------+ +------+      ",
                "|      | | .preview                       | |      |      ",
                "|      | |                                | |      |      ",
                "|      | |                                | |      |      ",
                "|      | |                                | |      |      ",
                "|      | |                                | |      |$hght2",
                "|      | |                                | |      |      ",
                "|      | |                                | |      |      ",
                "|      | |                                | |      |      ",
                "|      | |                                | |      |      ",
                "|      | |                                | |      |      ",
                "+------+ +--------------------------------+ +------+      ",
                "|0.5rem| | auto                           | |0.5rem|      "
      .editor
        display: none

  .topbar
    background: #23272E
    color: colvar('text-light')
    font-set('display')
    font-size: 0.9rem
    line-height: 2rem
    padding: 0 1rem
    z-index: 10

    > label
      padding-right: 1rem

  .editor
    background: #282C34
    z-index: 2
    overflow: hidden

  .preview
    position: relative
    background: colvar('background-light')
    width: var(--layout-body-max-width)
    max-width: 100%
    margin-left: auto
    margin-right: auto
    padding: 1rem
    padding-bottom: 100%
    overflow-y: scroll
    font-size: 90%
    z-index: 1
    contain: strict

  .perf-box
    position: sticky
    display: inline-flex
    flex-direction: column
    top: 0.5rem
    float: right
    margin-left: -100%
    padding: 0.25rem
    background: #23272E
    border-radius: 0.25rem
    color: #ABB2BF
    z-index: 10


</style>

<!-- some chores to do on resize -->
<svelte:window on:resize={updatePreview}/>

<div class=overflow-container
  in:tnAnime={{ background: ['transparent', '#23272E'], easing: 'easeOutExpo', duration: 500, delay: 300 }}
>
  <div class="editor-container {containerClass}">

    <!-- Top | Info Bar -->
    <div class=topbar
      in:tnAnime={{ translateY: ['-150%', '0'], duration: 600, delay: 200, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateY: '-150%', duration: 200, delay: 50, easing: 'easeInExpo' }}
    >
      <label>
        <input type='checkbox' bind:checked={showLivePreview}>
        Live Preview
      </label>
    </div>

    <!-- Left | Editor Pane -->
    <div class=editor bind:this={editorContainer}
      in:tnAnime={{ translateX: ['-150%', '0'], duration: 700, delay: 500, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateX: '-150%', duration: 200, easing: 'easeInExpo' }}
    />

    <!-- Right | Preview Pane -->
    <div class=preview bind:this={previewContainer}
      on:scroll={scrollFromPreview} 
      on:touchstart={() => scrollingWith = 'preview'} on:wheel={() => scrollingWith = 'preview'}
      in:tnAnime={{ translateX: ['-300%', '0'], duration: 700, delay: 500, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateX: '-300%', duration: 150, easing: 'easeInExpo' }}
    >
      {#if containerClass === 'show-both' || containerClass === 'show-preview'}
        <div class=perf-box>
          <span>PERF: {Math.round(perf)}ms</span>
          <span>CACHE: {Math.round(cacheSize)}</span>
        </div>
        <div class=rhythm bind:this={preview}/>
      {/if}
    </div>

  </div>
</div>