<script lang='ts'>
  // Library Imports
  import { EditorCore } from './editor-core'
  import { EditorView } from './codemirror-bundle-'
  import { onDestroy, onMount, setContext } from 'svelte'
  import { spring } from 'svelte/motion'
  import { createAnimQueued, throttle, waitFor } from '../../modules/util'
  import { Markdown } from '../../modules/workers'
  // Components
  import {
    tnAnime, Pref, focusGroup,
    Markdown as MarkdownComponent,
    Toggle, DetailsMenu, Button, Card, TextInput, TabControl, Tab
  } from '@components'
  import EditorBlock from './EditorBlock.svelte'
  import Stats from './Stats.svelte'

  // TODO: cheatsheet
  // TODO: allow adjusting line-wrap?
  // TODO: swipe to show preview on mobile

  let mounted = false

  // -- STATE

  const settings = Pref.bind('editor-settings', {
    darkmode: true,
    gutters: true,
    spellcheck: false,
    preview: {
      enable: true,
      live: true,
      darkmode: false,
      activelines: true
    }
  })

  let editorContainer: HTMLElement
  let preview: HTMLDivElement

  let scrollingWith: 'editor' | 'preview' = 'editor'
  const previewScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })
  const editorScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })

  // from Markdown component
  let heightmap: Map<number, number>
  let heightlist: number[]

  $: containerClass = $settings.preview.enable ? 'show-both' : 'show-editor'
  $: if (preview && scrollingWith === 'editor') preview.scrollTop = $previewScrollSpring
  $: if (mounted && scrollingWith === 'preview') Editor.view.scrollDOM.scrollTop = $editorScrollSpring

  // -- EDITOR

  const Editor = new EditorCore()
  const activeLines = Editor.activeLines

  onMount(async () => {
    await waitFor(() => !!editorContainer)
    await Editor.init(
      editorContainer,
      await fetch('/static/misc/md-test.md').then(res => res.text()),
      [EditorView.domEventHandlers({
        wheel: () => { scrollingWith = 'editor' },
        scroll: () => { scrollFromEditor() }
      })]
    )
    mounted = true
  })

  onDestroy(() => Editor.destroy())

  $: if (mounted) Editor.spellcheck = $settings.spellcheck
  $: if (mounted) Editor.gutters = $settings.gutters

  setContext('editor', Editor)

  // -- PREVIEW <-> EDITOR

  // Scroll Sync.

  function canScrollSync() { return mounted && preview && Editor.view && heightmap && heightlist }

  const updateScroll = throttle(() => {
    scrollFromEditor()
    scrollFromPreview()
  }, 100)

  /** Updates the preview scroll position if the scroll sync. is currently editor based.
   *  Should be called whenever a scrolling event is detected from the editor. */
  const scrollFromEditor = createAnimQueued(() => {
    if (scrollingWith === 'preview' || !canScrollSync()) return
    const scrollTop = Editor.view.scrollDOM.scrollTop
    void editorScrollSpring.set(scrollTop)
    // get top most visible line
    const domRect = editorContainer.getBoundingClientRect()
    const pos = Editor.view.posAtCoords({ x: domRect.x, y: domRect.y })
    if (pos === 0) {
      void previewScrollSpring.set(0)
      return
    }
    const line = Editor.doc.lineAt(pos ?? 0).number
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
      const diff = scrollTop - Editor.heightAtLine(curLine + 1)
      void previewScrollSpring.set(lineHeight + diff)
    }
  })

  /** Updates the editor scroll position if the scroll sync. is currently preview based.
   *  Should be called whenever a scrolling event is detected from the preview. */
  const scrollFromPreview = createAnimQueued(() => {
    if (scrollingWith === 'editor' || !canScrollSync()) return
    const scrollTop = preview.scrollTop
    void previewScrollSpring.set(scrollTop)
    // filter for the closest line height
    const line = heightlist.findIndex(height => scrollTop < height)
    if (line !== -1) {
      // fudge to prevent the editor from getting sticky
      const diff = (scrollTop - heightlist[line]) * 0.75
      void editorScrollSpring.set(Editor.heightAtLine(line) + diff)
    }
  })

</script>

<!-- some chores to do on resize -->
<svelte:window on:resize={updateScroll}/>

<div class='overflow-container {$settings.darkmode ? 'dark codetheme-dark' : 'light codetheme-light'}'
  in:tnAnime={{ opacity: [0, 1], easing: 'easeOutExpo', duration: 750, delay: 150 }}
>
  <div class='editor-container {containerClass}'>
    <!-- Left | Editor Pane -->
    <div class='editor-pane'
      on:scroll={scrollFromEditor}
      on:touchstart={() => scrollingWith = 'editor'} on:wheel={() => scrollingWith = 'editor'}
      in:tnAnime={{ translateX: ['-200%', '0'], duration: 800, delay: 300, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateX: '-600%', duration: 200, delay: 50, easing: 'easeInExpo' }}
    >
      <div class='topbar' use:focusGroup={'horizontal'}>
        <div class='topbar-section'>
          <span class='topbar-label'>Draft</span>
          <TextInput bind:value={$Editor.draft.name} thin placeholder='Draft name...' />
          <Button i='carbon:save' tip='Save Draft Locally' size='1.5rem' baseline
            on:click={() => Editor.saveLocally()}/>
          <Button i='carbon:data-base' tip='Manage Drafts' size='1.5rem' baseline/>
        </div>
        <div class='topbar-section'>
          <Stats />
        </div>
      </div>

      <div class='editor-settings'>
        <DetailsMenu placement='bottom-end'>
          <slot slot='summary'>
            <Button summary i='fluent:settings-28-filled' tip='Editor Settings' floating size='1.5rem' />
          </slot>
          <Card>
            <div class='settings-menu' use:focusGroup={'vertical'}>
              <Toggle bind:toggled={$settings.darkmode}>Dark Mode</Toggle>
              <Toggle bind:toggled={$settings.gutters}>Gutters</Toggle>
              <Toggle bind:toggled={$settings.spellcheck}>Spellcheck</Toggle>
              <Toggle bind:toggled={$settings.preview.enable}>Preview Pane</Toggle>
            </div>
          </Card>
        </DetailsMenu>
      </div>

      <div class=editor bind:this={editorContainer}/>

    </div>

    <!-- Right | Preview Pane -->
    <div class='preview-pane {$settings.preview.darkmode ? 'dark codetheme-dark' : 'light codetheme-light'}'
      in:tnAnime={{ translateX: ['-300%', '0'], duration: 900, delay: 350, easing: 'easeOutQuint' }}
      out:tnAnime={{ translateX: '-300%', duration: 150, easing: 'easeInQuint' }}
    >
      {#if containerClass === 'show-both' || containerClass === 'show-preview'}

        <div class='preview-settings'>
          <DetailsMenu placement='bottom-end'>
            <slot slot='summary'>
              <Button summary i='fluent:settings-28-filled' tip='Preview Settings' floating size='1.5rem' />
            </slot>
            <Card>
              <div class='settings-menu' use:focusGroup={'vertical'}>
                <Toggle bind:toggled={$settings.preview.darkmode}>Dark Mode</Toggle>
                <Toggle bind:toggled={$settings.preview.activelines}>Show Active Line</Toggle>
              </div>
            </Card>
          </DetailsMenu>
        </div>

        <TabControl noborder contain compact conditional>
          <Tab>
            <slot slot='button'><span style='font-size: 0.9em'>Result</span></slot>
            <div class='preview codetheme-dark' bind:this={preview}
              on:scroll={scrollFromPreview}
              on:touchstart={() => scrollingWith = 'preview'} on:wheel={() => scrollingWith = 'preview'}
            >
              <MarkdownComponent details morph bind:heightmap bind:heightlist
                on:firstrender={() => preview.scrollTop = $previewScrollSpring}
                template={$Editor.value} activelines={$settings.preview.activelines ? $activeLines : new Set()}
              />
            </div>
          </Tab>
          <Tab>
            <slot slot='button'><span style='font-size: 0.9em'>HTML Output</span></slot>
            <div class='preview-html'>
              <EditorBlock content={Markdown.render($Editor.value, true)} lang='html' />
            </div>
          </Tab>
        </TabControl>
      {/if}
    </div>

  </div>
</div>

<style lang='stylus'>
  @require '_lib'

  $hght = calc(100vh - var(--layout-header-height-edit))
  $body-w = minmax(0, var(--layout-body-max-width))
  $edit-w = minmax(50%, 1fr)

  .overflow-container
    position: relative
    width: 100%
    height: $hght
    overflow: hidden
    background: var(--colcode-background)

  .editor-container
    width: 100%

    &.show-both
      grid-kiss:"+------------------------+ +-----------------------+       ",
                "| .editor-pane           | | .preview-pane         |       ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "|                        | |                       | $hght ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "|                        | |                       |       ",
                "+------------------------+ +-----------------------+       ",
                "|        $edit-w         | |        $body-w        |       "

    &.show-editor
      grid-kiss:"+--------------------------------------------------+       ",
                "| .editor-pane                                     |       ",
                "|                                                  |       ",
                "|                                                  |       ",
                "|                                                  |       ",
                "|                                                  |       ",
                "|                                                  |       ",
                "|                                                  | $hght ",
                "|                                                  |       ",
                "|                                                  |       ",
                "|                                                  |       ",
                "|                                                  |       ",
                "|                                                  |       ",
                "|                                                  |       ",
                "+--------------------------------------------------+       ",
                "| 100%                                             |       "

    &.show-preview
      grid-kiss:"+------+ +--------------------------------+ +------+       ",
                "|      | | > .preview-pane <              | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      | $hght ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "|      | |                                | |      |       ",
                "+------+ +--------------------------------+ +------+       ",
                "|0.5rem| | $body-w                        | |0.5rem|       "
      .editor
        display: none

  .topbar
    z-index: 10
    display: flex
    flex-wrap: nowrap
    padding: 0.1rem 0.5rem
    font-size: 0.9rem
    white-space: nowrap
    background: var(--colcode-background)
    font-set('display')

  .topbar-section
    display: flex
    gap: 0.25rem
    align-items: center
    margin-right: 0.25rem
    padding-right: 0.25rem
    border-right: 0.15rem solid colvar('border')

  .topbar-label
    margin-right: 0.25rem
    color: colvar('text-subtle')

  .editor-pane
    position: relative
    z-index: 2
    padding-right: 0.25rem
    overflow: hidden
    background: var(--colcode-background)

  .preview-pane
    position: relative
    z-index: 1
    overflow: hidden
    background: var(--colcode-background)
    border-left: solid 0.125rem colvar('border')

  .editor-settings, .preview-settings
    position: absolute
    top: 3rem
    right: 1rem
    z-index: 10
    width: 2.5rem
    height: 2.5rem

    +match-media(thin, below)
      right: 0

  .settings-menu
    display: flex
    flex-direction: column
    width: max-content
    font-set('display')
    font-size: 0.9rem

  .editor
    height: 100%

  .preview, .preview-html
    position: relative
    z-index: 1
    height: 100%
    contain: strict

  .preview
    padding: 0 1rem
    padding-bottom: 100%
    overflow-y: scroll
    --font-content-size: 0.75

  .preview-html
    padding: 0 0.5rem

</style>
