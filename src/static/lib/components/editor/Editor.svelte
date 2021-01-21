<script lang="ts">
  // Library Imports
  import * as API from '../../modules/api'
  import { EditorCore } from './editor-core'
  import { onDestroy, onMount, setContext } from 'svelte'
  import { spring } from 'svelte/motion'
  import { tnAnime } from '../../modules/components'
  import { createAnimQueued, doMatchMedia, throttle } from '../../modules/util'
  // Components
  import Markdown from '../Markdown.svelte'
  import IconButton from '../IconButton.svelte'
  import Toggle from '../Toggle.svelte'
  import DetailsMenu from '../DetailsMenu.svelte'

  // TODO: cheatsheet
  // TODO: allow adjusting line-wrap?
  // TODO: mobile mode
  // TODO: swipe to show preview on mobile

  let mounted = false

  // -- CONTAINER

  $: containerClass = editorLivePreview ? 'show-both' : 'show-editor'

  // -- EDITOR

  let editorContainer: HTMLElement
  const Editor = new EditorCore()
  const EditorValue = Editor.value
  const EditorActiveLines = Editor.activeLines

  onMount(async () => {
    Editor.init(editorContainer, await fetch('/static/misc/md-test.md').then(res => res.text()))
    mounted = true
  })

  onDestroy(() => Editor.destroy())

  // Configuration
  let editorDarkMode = true
  let editorGutters = true
  let editorSpellCheck = false
  let editorLivePreview = true

  $: if (mounted) Editor.spellcheck = editorSpellCheck
  $: if (mounted) Editor.lineNumbers = editorGutters

  // defaults on mobile
  if (doMatchMedia('thin', 'below')) {
    editorGutters = false
    editorLivePreview = false
  }

  // Context

  setContext('editor', Editor)

  // -- PREVIEW

  let preview: HTMLDivElement

  // Markdown Component
  let heightmap: Map<number, number>
  let heightlist: number[]

  // Configuration
  let previewDarkMode = false
  let previewActiveLine = true

  // -- PREVIEW <-> EDITOR

  // Scroll Sync.

  /** Denotes whether the editor or the preview is the element the user is scrolling with. */
  let scrollingWith: 'editor' | 'preview' = 'editor'
  /** The spring for the preview's sync. scroll position. */
  let previewScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })
  /** The spring for the editor's sync. scroll position. */
  let editorScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })

  const updateScroll = throttle(() => {
    scrollFromEditor()
    scrollFromPreview()
  }, 100)

  /** Updates the preview scroll position if the scroll sync. is currently editor based.
   *  Should be called whenever a scrolling event is detected from the editor. */
  const scrollFromEditor = createAnimQueued(() => {
    if (scrollingWith === 'preview' || !mounted) return
    const scrollTop = Editor.view.scrollDOM.scrollTop
    editorScrollSpring.set(scrollTop)
    // get top most visible line
    const domRect = editorContainer.getBoundingClientRect()
    const pos = Editor.view.posAtCoords({ x: domRect.x, y: domRect.y })
    let line = Editor.doc.lineAt(pos ?? 1).number - 1
    // find our line height
    let lineHeight = 0
    let curLine = line
    // check if we have our line or not
    if (heightmap.has(line)) lineHeight = heightmap.get(line)!
    // no? get closest line before this one
    else for (;curLine > 0; curLine--) if (heightmap.has(curLine)) {
      lineHeight = heightmap.get(curLine)!
      break
    }
    // set preview scroll
    if (lineHeight) {
      // fudge value to prevent the preview from getting "sticky"
      const diff = (scrollTop - Editor.heightAtLine(curLine + 1)) * 0.75
      previewScrollSpring.set(lineHeight + diff)
    }
  })

  /** Updates the editor scroll position if the scroll sync. is currently preview based.
   *  Should be called whenever a scrolling event is detected from the preview. */
  const scrollFromPreview = createAnimQueued(() => {
    if (scrollingWith === 'editor' || !mounted) return
    const scrollTop = preview.scrollTop
    previewScrollSpring.set(scrollTop)
    // filter for the closest line height
    const line = heightlist.findIndex(height => scrollTop < height)
    if (line !== -1) {
      // fudge to prevent the editor from getting sticky
      const diff = (scrollTop - heightlist[line]) * 0.75
      editorScrollSpring.set(Editor.heightAtLine(line) + diff)
    }
  })

  // updates scroll sync. positions
  $: if (mounted && scrollingWith === 'editor') preview.scrollTop = $previewScrollSpring
  $: if (mounted && scrollingWith === 'preview') Editor.view.scrollDOM.scrollTop = $editorScrollSpring

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
    background: var(--colcode-background)
    overflow: hidden

  .editor-container
    width: 100%
    box-shadow: 0 0 4rem black

    &.show-both
      grid-kiss:"+--------------------------------------------------+      ",
                "| .topbar                                          | 2rem ",
                "+--------------------------------------------------+      ",
                "+------------------------+ +-----------------------+      ",
                "| .editor-pane           | | .preview              |      ",
                "|                        | |                       |      ",
                "|                        | |                       |      ",
                "|                        | |                       |      ",
                "|                        | |                       |$hght2",
                "|                        | |                       |      ",
                "|                        | |                       |      ",
                "|                        | |                       |      ",
                "|                        | |                       |      ",
                "|                        | |                       |      ",
                "+------------------------+ +-----------------------+      ",
                "|        $edit-w         | |        $body-w        |      "

    &.show-editor
      grid-kiss:"+--------------------------------------------------+      ",
                "| .topbar                                          | 2rem ",
                "+--------------------------------------------------+      ",
                "+--------------------------------------------------+      ",
                "| .editor-pane                                     |      ",
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
                "|      | | > .preview <                   | |      |      ",
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
    display: flex
    background: var(--colcode-background)
    font-set('display')
    font-size: 0.9rem
    line-height: 1.9rem
    padding: 0.1rem 0.5rem
    z-index: 10
    flex-wrap: nowrap
    white-space: nowrap

  .topbar-section
    display: flex
    gap: 0.5rem
    align-items: center
    padding: 0 0.5rem
    border-right: 0.15rem solid colvar('border')

  .editor-pane
    position: relative
    z-index: 2
    overflow: hidden
    border-right: solid 0.125rem colvar('border')
    padding-right: 0.25rem
    background: var(--colcode-background)

  .editor-settings, .preview-settings
    position: absolute
    height: 2.5rem
    width: 2.5rem
    top: 1rem
    right: 1rem
    z-index: 10

  .preview-settings
    position: sticky
    top: 1rem
    right: 0
    margin-left: calc(100% - 1.5rem)

  .settings-menu
    display: flex
    flex-direction: column
    width: max-content
    font-set('display')
    font-size: 0.9rem

  .editor
    height: 100%

  .preview
    position: relative
    width: var(--layout-body-max-width)
    max-width: 100%
    padding: 0 1rem
    padding-bottom: 100%
    overflow-y: scroll
    font-size: 90%
    z-index: 1
    box-shadow: inset 0 1rem 0.5rem -1rem rgba(black, 0.25)
    contain: strict

</style>

<!-- some chores to do on resize -->
<svelte:window on:resize={updateScroll}/>

<div class='overflow-container {editorDarkMode ? 'dark codetheme-dark' : 'light codetheme-light'}'
  in:tnAnime={{ opacity: [0, 1], easing: 'easeOutExpo', duration: 750, delay: 150 }}
>
  <div class="editor-container {containerClass}">

    <!-- Top | Settings Bar -->
    <div class=topbar
      in:tnAnime={{ translateY: ['-150%', '0'], duration: 600, delay: 400, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateY: '-150%', duration: 200, delay: 50, easing: 'easeInExpo' }}
    >
      <div class=topbar-section>
        <IconButton i='carbon:document-download' label='Open' size='1.5rem' baseline/>
        <IconButton i='carbon:save' label='Save Draft' size='1.5rem' baseline/>
        <IconButton i='carbon:fetch-upload-cloud' label='Publish' size='1.5rem' baseline/>
      </div>
    </div>

    <!-- Left | Editor Pane -->
    <div class=editor-pane
      on:scroll={scrollFromEditor}
      on:touchstart={() => scrollingWith = 'editor'} on:wheel={() => scrollingWith = 'editor'}
      in:tnAnime={{ translateX: ['-200%', '0'], duration: 800, delay: 300, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateX: '-600%', duration: 200, delay: 50, easing: 'easeInExpo' }}
    >
      <div class='editor-settings'>
        <DetailsMenu i='fluent:settings-28-filled' label='Editor Settings'>
          <div class='settings-menu'>
            <Toggle bind:toggled={editorDarkMode}>Dark Mode</Toggle>
            <Toggle bind:toggled={editorGutters}>Gutters</Toggle>
            <Toggle bind:toggled={editorSpellCheck}>Spellcheck</Toggle>
            <Toggle bind:toggled={editorLivePreview}>Live Preview</Toggle>
          </div>
        </DetailsMenu>
      </div>
      <div class=editor bind:this={editorContainer}/>
    </div>

    <!-- Right | Preview Pane -->
    <div class='preview {previewDarkMode ? 'dark' : 'light'} codetheme-dark' bind:this={preview}
      on:scroll={scrollFromPreview}
      on:touchstart={() => scrollingWith = 'preview'} on:wheel={() => scrollingWith = 'preview'}
      in:tnAnime={{ translateX: ['-300%', '0'], duration: 900, delay: 350, easing: 'easeOutQuint' }}
      out:tnAnime={{ translateX: '-300%', duration: 150, easing: 'easeInQuint' }}
    >
      {#if containerClass === 'show-both' || containerClass === 'show-preview'}
        <div class='preview-settings'>
          <DetailsMenu i='fluent:settings-28-filled' label='Preview Settings'>
            <div class='settings-menu'>
              <Toggle bind:toggled={previewDarkMode}>Dark Mode</Toggle>
              <Toggle bind:toggled={previewActiveLine}>Show Active Line</Toggle>
            </div>
          </DetailsMenu>
        </div>
        <Markdown details morph bind:heightmap bind:heightlist
          template={$EditorValue} activelines={previewActiveLine ? $EditorActiveLines : new Set()} />
      {/if}
    </div>

  </div>
</div>