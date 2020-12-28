<!-- <script context="module" lang="ts">
  const extendedTokenStyling = [
    `${mtk(160, 165, 180)} { text-decoration: line-through; }`, // strikethrough
    `${mtk(50, 50, 60)} { background: #FFCB6BEE; }`, // mark
    `${mtk(190, 195, 205)} { position: relative; top: -0.25em; font-size: 90%; }`, // superscript
    `${mtk(195, 190, 205)} { position: relative; top: 0.25em; font-size: 90%; }`, // subscript
    // horizontal rules
    `${mtk(225, 100, 110)}::after {
      content: ""; position: absolute; left: 0; top: 50%; z-index: -1;
      width: calc(50 * 14px); border-top: 0.125rem solid #333842;}`,
  ]
  const oldElement = document.head.querySelector('#mainframe-monaco-token-styling')
  if (oldElement) document.head.removeChild(oldElement)

  const styleElement = document.createElement('style')
  styleElement.id = 'mainframe-monaco-token-styling'
  styleElement.innerHTML = extendedTokenStyling.join('\n')
  document.head.appendChild(styleElement)
</script> -->

<script lang="ts">
  // Library Imports
  import { onDestroy, onMount } from 'svelte'
  import { spring } from 'svelte/motion'
  import { morphMarkdown } from '@modules/markdown'
  import { tnAnime } from '@modules/anime'
  import { sleep, idleCallback, createIdleQueued, createAnimQueued, throttle } from '@modules/util'
  // CodeMirror
  import { EditorState, EditorView, getExtensions } from './editor-config'

  // CodeMirror Init.
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
        doc: "Hello World",
        extensions: mergedExtensions
      }),
      parent: editorContainer
    })

    update()
  })

  onDestroy(() => { editorView.destroy() })

  // -- STATE

  let preview: HTMLDivElement
  let previewContainer: HTMLElement

  let perf = 0
  let cacheSize = 0

  let previewRect: DOMRect
  let domRect: DOMRect

  // Scroll Sync.
  let arrLineHeight: number[] = []
  let mapLineHeight: Map<number, number> = new Map()
  /** Denotes whether the editor or the preview is the element the user is scrolling with. */
  let scrollingWith: 'editor' | 'preview' = 'editor'
  /** The spring for the preview's sync. scroll position. */
  let previewScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })
  /** The spring for the editor's sync. scroll position. */
  let editorScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })

  // -- UTIL. FUNCTIONS

  /** Generally updates the entire editor's misc. state variables. */
  const update = throttle(() => {
    previewRect = preview.getBoundingClientRect()
    domRect = editorView.dom.getBoundingClientRect()
    updateHTML()
    updateScrollMap()
    scrollFromEditor()
    scrollFromPreview()
  }, 100)

  /** Returns the scrollTop height of the specified line. */
  function heightAtLine (line: number) {
    return editorView.visualLineAt(editorView.state.doc.line(line).from).top
  }

  // -- FUNCTIONS

  /** Updates the preview's HTML based on the current editor state. */
  const updateHTML = createIdleQueued(async () => {
    if (!preview || !editorView) return
    const startPerf = performance.now()
    // rather than replace the whole tree we just replace what's changed using MorphDOM
    await idleCallback(async () => {
      const stats = await morphMarkdown(editorView.state.doc.toString(), preview)
      updateScrollMap()
      cacheSize = stats.cacheSize
      perf = performance.now() - startPerf
      // basically a fudge, but this helps prevent chugging
      await sleep(perf)
    })
  })

  /** Updates the scroll map that is used for scroll syncing between the editor and preview. */
  const updateScrollMap = createAnimQueued(() => {
    if (!preview || !editorView) return
    const previewTop = preview.getBoundingClientRect().top
    // here we map every [data-line] element's line to its offset scroll height
    // we also make a array version of the same Map, for usage with iterators
    arrLineHeight = []
    Array.from(preview.querySelectorAll<HTMLElement>('[data-line]'))
      .forEach(elem => {
        const dataLine = parseInt(elem.getAttribute('data-line') as string)
        const height = elem.getBoundingClientRect().top - previewTop
        mapLineHeight.set(dataLine, height)
        arrLineHeight[dataLine] = height
      })

    // starts a poll (because it calls itself) to catch flukes
    setTimeout(() => { if (preview && editorView) updateScrollMap() }, 5000)
  })

  /** Updates the preview scroll position if the scroll sync. is currently editor based.
   *  Should be called whenever a scrolling event is detected from the editor. */
  const scrollFromEditor = createAnimQueued(() => {
    if (scrollingWith === 'preview' || !preview || !editorView) return
    const scrollTop = editorContainer.scrollTop
    editorScrollSpring.set(scrollTop)
    // get top most visible line
    const pos = editorView.posAtCoords({ x: domRect.x, y: domRect.y })
    let line =
    editorView.state.doc.lineAt(pos ?? 0).number
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
    const scrollTop = previewContainer.scrollTop
    previewScrollSpring.set(scrollTop)
    // filter for the closest line height
    const line = arrLineHeight.findIndex(height => scrollTop < height)
    if (line !== -1) {
      // fudge to prevent the editor from getting sticky
      // const diff = (scrollTop - line) * 0.75
      editorScrollSpring.set(heightAtLine(line))
    }
  })

  // -- REACTIVE

  // updates scroll sync. positions
  $: if (previewContainer && scrollingWith === 'editor') previewContainer.scrollTop = $previewScrollSpring
  $: if (editorView && scrollingWith === 'preview') editorContainer.scrollTop = $editorScrollSpring

</script>

<style lang="stylus">
  @require '_lib'

  $hght = calc(100vh - var(--layout-header-height) - var(--layout-footer-height))
  $hght2 = calc(100vh - 2rem - var(--layout-header-height) - var(--layout-footer-height))
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
    box-sizing: content-box

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

  .topbar
    background: #23272E
    z-index: 10

  $col-editor-bg = #282C34
  .editor
    background: $col-editor-bg
    z-index: 2
    overflow-y: scroll


  .preview
    position: relative
    background: colvar('background-light')
    box-shadow: 0 0 10px rgba(0,0,0,0.5) inset
    padding: 1rem
    padding-bottom: 100%
    overflow-y: scroll
    font-size: 90%
    z-index: 1
    transform: translate(0,0)

  .perf-box
    position: sticky
    display: inline-flex
    flex-direction: column
    top: 0.5rem
    float: right
    padding: 0.25rem
    background: #23272E
    border-radius: 0.25rem
    color: #ABB2BF
    z-index: 10


</style>

<!-- some chores to do on resize -->
<svelte:window on:resize={update}/>

<div class=overflow-container
  in:tnAnime={{ background: ['transparent', '#23272E'], easing: 'easeOutExpo', duration: 500, delay: 300 }}
>
  <div class=editor-container>

    <!-- Top | Info Bar -->
    <div class=topbar
      in:tnAnime={{ translateY: ['-150%', '0'], duration: 600, delay: 200, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateY: '-150%', duration: 200, delay: 50, easing: 'easeInExpo' }}
    />

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
      <div class=perf-box>
        <span>PERF: {Math.round(perf)}ms</span>
        <span>CACHE: {Math.round(cacheSize)}</span>
      </div>
      <div class=rhythm bind:this={preview}/>
    </div>

  </div>
</div>