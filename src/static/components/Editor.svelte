<script context="module" lang="ts">
  // Import Monaco and its features
  import * as monaco from '@js/editor/monaco'
  import * as mdLang from '@js/editor/markdown-lang'
  import { waitFor } from '@modules/util'

  (self as any).MonacoEnvironment = {
    getWorker: function(moduleId:string, label:string) {
      console.log("Getting worker", moduleId, label)
      let workerURL = '/static/js/workers/monaco-worker.js'
      if (label === 'json')
        workerURL = '/static/js/workers/monaco-worker-json.js'
      else if (label === 'css')
        workerURL = '/static/js/workers/monaco-worker-css.js'
      else if (label === 'html')
        workerURL = '/static/js/workers/monaco-worker-html.js'
      else if (label === 'typescript' || label === 'javascript')
        workerURL = '/static/js/workers/monaco-worker-ts.js'
      return new Worker(workerURL, {
        type: import.meta.env.MODE === 'development' ? "module" : "classic"
      })
    }
  }

  // Setup theme
  import { theme, settings } from '@js/editor/editor-config'
  monaco.editor.defineTheme('confinement', theme)
  monaco.editor.setTheme('confinement')

  // Setup markdown lang.
  // We don't use the original 'markdown' lang. so that it doesn't conflict
  monaco.languages.register({ id: 'markdown-extended' })
  // the language definition is literally copied from the monaco codebase
  // so the fact that it doesn't type-check is just confusing and ignored
  monaco.languages.setLanguageConfiguration('markdown-extended', mdLang.conf as any)
  monaco.languages.setMonarchTokensProvider('markdown-extended', mdLang.language as any)

  import { TokenizationRegistry } from 'monaco-editor/esm/vs/editor/common/modes.js'

  waitFor(() => TokenizationRegistry['_colorMap'] !== null).then(() => {
    function mtk(red: number, green: number, blue: number) {
      const colorMap = TokenizationRegistry['_colorMap'] as {rgba: { r: number, g: number, b: number }}[]
      // for some reason forEach is the only method that works here
      let result = 0
      colorMap.forEach((color, idx) => {
        const { r, g, b } = color.rgba
        if (r === red && g === green && b === blue) result = idx
      })
      return '.mtk' + result
    }

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
  })
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import { spring } from 'svelte/motion'
  import { morphMarkdown } from '@modules/markdown'
  import { tnAnime } from '@modules/anime'
  import { sleep, idleCallback, createIdleQueued } from '@modules/util'

  // Editor init. (see onMount() below for the rest)
  let editorContainer: HTMLElement
  let editor: ReturnType<typeof monaco['editor']['create']>

  // Preview Updating
  // TODO: figure out if putting the preview in an iframe would help
  let preview: HTMLDivElement
  let previewContainer: HTMLElement
  let perf = 0
  let cacheSize = 0
  const updateHTML = createIdleQueued(async () => {
    if (!preview || !editor) return
    const startPerf = performance.now()
    // rather than replace the whole tree we just replace what's changed using MorphDOM
    await idleCallback(async () => {
      const stats = await morphMarkdown(editor.getValue(), preview)
      updateScrollMap()
      cacheSize = stats.cacheSize
      perf = performance.now() - startPerf
      // basically a fudge, but this helps prevent chugging
      await sleep(perf)
    })
  })

  // Scroll Matching
  let arrLineHeight: [number, number][] = []
  let mapLineHeight: Map<number, number> = new Map()
  // What the user scrolled on last will change this value.
  let scrollingWith: 'editor' | 'preview' = 'editor'
  // These springs are what actually set the scroll values.
  let previewScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })
  let editorScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })

  let scrollMapPoll: number
  const updateScrollMap = createIdleQueued(() => {
    if (!preview || !editor) return
    const previewRect = preview.getBoundingClientRect()
    // here we map every [data-line] element's line to its offset scroll height
    // we also make a array version of the same Map, for usage with iterators
    Array.from(preview.querySelectorAll<HTMLElement>('[data-line]'))
      .forEach(elem => {
        const dataLine = parseInt(elem.getAttribute('data-line') as string)
        mapLineHeight.set(dataLine, elem.getBoundingClientRect().top - previewRect.top)
      })
    arrLineHeight = Array.from(mapLineHeight)

    // start a poll to catch flukes
    clearInterval(scrollMapPoll)
    scrollMapPoll = setInterval(() => {
      if (preview && editor) updateScrollMap()
      else clearInterval(scrollMapPoll)
    }, 5000)
  })

  function scrollFromEditor () {
    if (scrollingWith === 'preview' || !preview || !editor) return
    editorScrollSpring.set(editor.getScrollTop())
    // get top most visible line
    const line = editor.getVisibleRanges()[0].startLineNumber - 1
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
      const diff = (editor.getScrollTop() - editor.getTopForLineNumber(curLine)) * 0.75
      previewScrollSpring.set(lineHeight + diff)
    }
  }

  function scrollFromPreview() {
    if (scrollingWith === 'editor' || !preview || !editor) return
    const scrollTop = previewContainer.scrollTop
    previewScrollSpring.set(scrollTop)
    // filter for the closest line height
    const line = arrLineHeight.find(([, height]) => scrollTop < height)
    if (line) {
      // fudge to prevent the editor from getting sticky
      const diff = (scrollTop - line[1]) * 0.75
      editorScrollSpring.set(editor.getTopForLineNumber(line[0]) + diff)
    }
  }

  // update scroll position (reactive)
  $: if (previewContainer && scrollingWith === 'editor') previewContainer.scrollTop = $previewScrollSpring
  $: if (editor && scrollingWith === 'preview') editor.setScrollTop($editorScrollSpring)

  // Load Editor
  onMount(() => {
    editor = monaco.editor.create(editorContainer, settings)

    // Update Preview
    editor.onDidChangeModelContent(() => {
      scrollingWith = 'editor'
      updateHTML()
    })
    // init. preview
    updateHTML();

    // Scroll Matching
    (editor.getDomNode() as HTMLElement).addEventListener('wheel', () => scrollingWith = 'editor')
    editor.onDidScrollChange(scrollFromEditor)

  })

</script>

<style lang="stylus">
  @require '_lib'
      

  $hght = calc(100vh - var(--layout-header-height) - var(--layout-footer-height))
  $body-w = minmax(0, var(--layout-body-max-width))
  $edit-w = minmax(50%, 1fr)

  .overflow-container
    height: $hght
    width: 100%
    overflow: hidden
    background: #23272E

  .editor-container
    position: relative
    height: 100%
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
              "|               | |      | |              | |      | auto ",
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
<svelte:window on:resize={() => { if (preview && editor) { editor.layout(); updateScrollMap() } }}/>

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