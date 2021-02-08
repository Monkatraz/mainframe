<script lang='ts'>
  import { settings, EditorCore } from './editor-core'
  import { EditorView } from './codemirror-bundle-'
  import { onDestroy, onMount, setContext } from 'svelte'
  import { spring } from 'svelte/motion'
  import { Markdown } from '../../modules/workers'
  import {
    matchMedia, tnAnime, focusGroup, onSwipe,
    Markdown as MarkdownComponent,
    SubHeader, Toggle, DetailsMenu, Button, Card, TabControl, Tab
  } from '@components'
  import type { OnSwipeOpts } from '@components'
  import EditorBlock from './EditorBlock.svelte'
  import Topbar from './Topbar.svelte'

  // -- STATE

  let mounted = false

  let editorContainer: HTMLElement
  let preview: HTMLDivElement

  let scrollingWith: 'editor' | 'preview' = 'editor'
  const previewScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })
  const editorScrollSpring = spring(0, { stiffness: 0.05, damping: 0.25 })
  $: if ($previewScrollSpring || $editorScrollSpring) scrollSync(true)

  // from Markdown component
  let heightmap: Map<number, number>
  let heightlist: number[]

  $: small = $matchMedia('thin', 'below')
  $: containerClass = $settings.preview.enable ? 'show-preview' : 'show-editor'

  // set defaults when opening on mobile
  $: if (small && mounted) {
    $settings.preview.enable = false
    $settings.gutters = false
  }

  // -- EDITOR

  const Editor = new EditorCore() // @hmr:keep
  const activeLines = Editor.activeLines

  onMount(async () => {
    await Editor.init(
      editorContainer,
      await fetch('/static/misc/md-test.md').then(res => res.text()),
      [EditorView.domEventHandlers({
        touchstart: () => { scrollingWith = 'editor' },
        wheel: () => { scrollingWith = 'editor' },
        scroll: () => { scrollSync() }
      })]
    )
    mounted = true
  })

  onDestroy(() => Editor.destroy())

  $: if (mounted) Editor.spellcheck = $settings.spellcheck
  $: if (mounted) Editor.gutters = $settings.gutters

  setContext('editor', Editor)

  // -- PREVIEW <-> EDITOR

  const measure = {
    key: 'scroll-sync',
    read() {
      if (scrollingWith === 'editor') {
        const scrollTop = Editor.scrollTop
        editorScrollSpring.set(scrollTop, { hard: true })
        // get top most visible line
        const pos = Editor.view.visualLineAtHeight(scrollTop, 0).from
        if (pos === 0) {
          previewScrollSpring.set(0)
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
          previewScrollSpring.set(lineHeight + diff, { hard: small })
        }
      } else {
        const scrollTop = preview.scrollTop
        previewScrollSpring.set(scrollTop, { hard: true })
        // filter for the closest line height
        const line = heightlist.findIndex(height => scrollTop < height)
        if (line !== -1) {
          // fudge to prevent the editor from getting sticky
          const diff = (scrollTop - heightlist[line]) * 0.75
          editorScrollSpring.set(Editor.heightAtLine(line) + diff, { hard: small })
        }
      }
    },
    write() {
      if (scrollingWith === 'preview') Editor.scrollTop = $editorScrollSpring
      else preview.scrollTop = $previewScrollSpring
    }
  }

  function scrollSync(writeOnly = false) {
    if (!(mounted && preview && Editor.view && heightmap && heightlist)) return
    Editor.view.requestMeasure(writeOnly ? { read() {}, write: measure.write } : measure)
  }

  // -- SWIPING

  function swipeCancel(elem: HTMLElement) {
    elem.style.transform = ''
    elem.style.transition = ''
  }

  const swipeHandler: Partial<OnSwipeOpts> = {
    condition: () => small,
    threshold: 70,
    immediate: false,
    timeout: false,
    callback: (elem) => {
      $settings.preview.enable = !$settings.preview.enable
      swipeCancel(elem)
    },
    eventCallback: (elem, { type, diff }) => {
      if (type === 'move') {
        const state = $settings.preview.enable
        elem.style.transition = 'none'
        elem.style.transform = `translateX(calc(${state ? '-100% + ' : ''}${-diff[1]}px))`
      }
      else if (type === 'cancel' || type === 'end') swipeCancel(elem)
    }
  }

  // @hmr:reset
</script>

<!-- some chores to do on resize -->
<svelte:window on:resize={() => scrollSync()}/>

<SubHeader>Editor</SubHeader>

<div class='overflow-container {$settings.darkmode ? 'dark codetheme-dark' : 'light codetheme-light'}'>
  <div class='editor-container {containerClass}'
    use:onSwipe={{ ...swipeHandler, direction: $settings.preview.enable ? 'right' : 'left' }}
  >
    <!-- Left | Editor Pane -->
    <div class='editor-pane'
      in:tnAnime={small ? undefined : { translateX: ['-200%', '0'], duration: 800, easing: 'easeOutExpo' }}
      out:tnAnime={small ? undefined : { translateX: '-600%', duration: 200, delay: 50, easing: 'easeInExpo' }}
    >
      <Topbar/>

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
            </div>
          </Card>
        </DetailsMenu>
      </div>

      <div class=editor bind:this={editorContainer}/>

    </div>

    <!-- Right | Preview Pane -->
    <div class='preview-pane {$settings.preview.darkmode ? 'dark codetheme-dark' : 'light codetheme-light'}'
      in:tnAnime={small ? undefined : { translateX: ['-300%', '0'], duration: 900, easing: 'easeOutQuint' }}
      out:tnAnime={small ? undefined : { translateX: '-300%', duration: 150, easing: 'easeInQuint' }}
    >
      {#if containerClass === 'show-preview' || small}

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
            <span slot='button' class='fs-sm'>Result</span>
            <div class='preview codetheme-dark' bind:this={preview}
              on:scroll={() => scrollSync()}
              on:touchstart={() => scrollingWith = 'preview'} on:wheel={() => scrollingWith = 'preview'}
            >
              <MarkdownComponent details morph bind:heightmap bind:heightlist
                on:firstrender={() => preview.scrollTop = $previewScrollSpring}
                template={$Editor.value} activelines={$settings.preview.activelines ? $activeLines : new Set()}
              />
            </div>
          </Tab>
          <Tab>
            <span slot='button' class='fs-sm'>HTML Output</span>
            <div class='preview-html'>
              <EditorBlock content={Markdown.render($Editor.value, true)} lang='html' />
            </div>
          </Tab>
        </TabControl>
      {/if}
    </div>
  </div>
  {#if small}
    <div class='panel-selector fs-display'
      in:tnAnime={{ translateY: ['100%', '0'], duration: 400, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateY: '100%', duration: 200, delay: 50, easing: 'easeInExpo' }}
    >
      <Toggle bind:toggled={$settings.preview.enable}>
        <slot slot='before'>Editor</slot>
        Preview
      </Toggle>
    </div>
  {/if}
</div>

<style lang='stylus'>
  @require '_lib'

  $hght = calc(100vh - var(--layout-header-height-edit))
  $body-w = minmax(0, var(--layout-body-max-width))
  $edit-w = minmax(50%, 1fr)

  @keyframes reveal
    from
      opacity: 0
    to
      opacity: 1

  .overflow-container
    position: relative
    width: 100%
    height: $hght
    overflow: hidden
    background: var(--colcode-background)
    animation: reveal 0.25s 1 0s backwards ease-out

  // Small screen handling
  +match-media(thin, below)
    .editor-pane, .preview-pane
      position: absolute
      top: 0
      width: 100%
      height: 100%

    .editor-pane
      left: 0

    .preview-pane
      left: 100%

    .editor, .preview, .preview-html
      transition: visibility 1s

    .editor-container
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)
      will-change: transform
      &.show-preview
        transform: translateX(-100%)

  .panel-selector
    position: fixed
    bottom: 0
    left: 0
    z-index: 99
    display: flex
    justify-content: center
    width: 100%
    height: 2rem
    background: colvar('background')
    border-top: solid 0.125rem colvar('border')

  .editor-container
    position: relative
    width: 100%
    height: 100%

    +match-media(small, up)
      &.show-preview
        grid-kiss:"+------------------------+ +-----------------------+      ",
                  "| .editor-pane           | | .preview-pane         |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       | 100% ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "|                        | |                       |      ",
                  "+------------------------+ +-----------------------+      ",
                  "|        $edit-w         | |        $body-w        |      "

      &.show-editor
        grid-kiss:"+--------------------------------------------------+      ",
                  "| .editor-pane                                     |      ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "|                                                  | 100% ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "|                                                  |      ",
                  "+--------------------------------------------------+      ",
                  "| 100%                                             |      "

  .editor-pane, .preview-pane
    position: relative
    overflow: hidden
    background: var(--colcode-background)

  .editor-pane
    z-index: 2
    display: flex
    flex-direction: column
    padding-right: 0.25rem

  .preview-pane
    z-index: 1
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
    font-size: 0.875rem

  .editor
    overflow: hidden

  .preview, .preview-html
    position: relative
    z-index: 1
    height: 100%
    contain: strict

  .preview
    padding: 0 1rem
    padding-bottom: 100%
    overflow-y: scroll

    +match-media(thin, up)
      --font-content-size: 0.75

  .preview-html
    padding: 0 0.5rem

</style>
