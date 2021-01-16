<script context="module">
import { EditorState, tagExtension } from "@codemirror/state"
import {
  EditorView, keymap, ViewPlugin, ViewUpdate,
  highlightSpecialChars, highlightActiveLine, drawSelection
} from '@codemirror/view'
import { history, historyKeymap } from '@codemirror/history'
import { foldGutter, foldKeymap } from '@codemirror/fold'
import { indentOnInput } from '@codemirror/language'
import { lineNumbers } from '@codemirror/gutter'
import { defaultKeymap } from '@codemirror/commands'
import { bracketMatching } from '@codemirror/matchbrackets'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { commentKeymap } from '@codemirror/comment'
import { rectangularSelection } from '@codemirror/rectangular-selection'
// Local Extensions
import { redo } from '@codemirror/history'
import { indentMore, indentLess, copyLineDown } from '@codemirror/commands'
import { confinement } from './editor/editor-config'
import monarchMarkdown from './editor/monarch-markdown'

function getExtensions() {
  return [
    lineNumbers(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    highlightSelectionMatches(),
    autocompletion(),
    rectangularSelection(),
    highlightActiveLine(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...commentKeymap,
      ...completionKeymap,
      ...[
        { key: 'Tab', run: indentMore, preventDefault: true },
        { key: 'Shift-Tab', run: indentLess, preventDefault: true },
        { key: 'Mod-Shift-z', run: redo, preventDefault: true },
        { key: 'Mod-d', run: copyLineDown, preventDefault: true }
      ]
    ]),
    tagExtension('spellcheck', EditorView.contentAttributes.of({ spellcheck: 'false' })),
    monarchMarkdown.load(),
    confinement
  ]
}
</script>

<script lang="ts">
  // Library Imports
  import { onDestroy, onMount } from 'svelte'
  import { spring } from 'svelte/motion'
  import { fade } from 'svelte/transition'
  import { morphMarkdown } from './modules/markdown'
  import { tnAnime, tip } from './modules/components'
  import { idleCallback, createIdleQueued, createAnimQueued, throttle } from './modules/util'
  import type { Page } from './modules/api';
  // Components
  import Button from './components/Button.svelte'
  import IconButton from './components/IconButton.svelte'
  import Toggle from './components/Toggle.svelte'
  import Icon from './components/Icon.svelte'
  import DetailsMenu from './components/DetailsMenu.svelte'

  // TODO: add misc. info on topbar like word count and the like
  // TODO: cheatsheet
  // TODO: allow adjusting line-wrap?
  // TODO: mobile mode
  // TODO: swipe to show preview on mobile
  // TODO: split the editor+preview into its own component, API is handled by its parent

  export let page: Page = {
    path: 'scp/3685',
    meta: {
      authors: [],
      revision: 1,
      dateCreated: new Date,
      dateLastEdited: new Date,
      flags: [],
      tags: []
    },
    locals: {
      'en': {
        title: 'SCP-3685',
        subtitle: 'Something Else Entirely',
        description: 'Very interesting description!',
        template: ''
      }
    }
  }

  let pageLocal = 'en'

  // -- CONTAINER

  let containerClass: 'show-editor' | 'show-both' | 'show-preview' = 'show-both'
  let editorDarkMode = true
  let editorSpellCheck = false
  let editorLivePreview = true

  let previewDarkMode = false
  let previewActiveLine = true

  $: containerClass = editorLivePreview ? 'show-both' : 'show-editor'
  $: if (preview) updatePreview()
  $: if (!previewActiveLine) activeElements = new Set

  // handle spellcheck
  $: if(editorView) editorView.dispatch({ reconfigure: {
    'spellcheck': EditorView.contentAttributes.of({ spellcheck: String(editorSpellCheck) })
  }})

  // -- EDITOR

  let editor: HTMLElement
  let editorView: EditorView

  onMount(async () => {

    const updateHandler = ViewPlugin.define(() => {
      return {
        update(update: ViewUpdate) {
          // update html on change
          if (update.docChanged) { updateHTML() }
          // get active lines
          if (update.selectionSet || update.docChanged) {
            const lines: number[] = []
            for (const r of update.state.selection.ranges) {
              const lnStart = update.state.doc.lineAt(r.from).number
              const lnEnd = update.state.doc.lineAt(r.to).number
              if (lnStart === lnEnd) lines.push(lnStart - 1)
              else {
                const diff = lnEnd - lnStart
                for (let i = 0; i <= diff; i++)
                  lines.push((lnStart + i) - 1)
              }
            }
            getActiveElements(lines)
          }
        }
      }
    })

    const mergedExtensions = [
      EditorView.domEventHandlers({
        'wheel': () => { scrollingWith = 'editor' },
        'scroll': () => { scrollFromEditor() }
      }),
      updateHandler,
      getExtensions()
    ]

    editorView = new EditorView({
      state: EditorState.create({
        doc: await fetch('/static/misc/md-test.md').then(res => res.text()),
        extensions: mergedExtensions
      }),
      parent: editor
    })

    updatePreview()

  })

  onDestroy(() => { editorView.destroy() })

  // -- PREVIEW <-> EDITOR

  let preview: HTMLDivElement
  let previewContainer: HTMLElement

  // Active Line Highlighting

  function hasSiblings(elem: Element, ln: number) {
    if (!elem.parentElement) return false
    if (elem.parentElement.querySelectorAll(`:scope > [data-line="${ln}"]`).length === 1)
      return false
    return true
  }

  const activeExclude = ['TBODY', 'THEAD', 'CODE']

  let activeElements: Set<Element> = new Set
  const getActiveElements = createIdleQueued((lines: number[]) => {
    if (!preview || !editorView || !previewActiveLine) return
    // disable all currently active lines
    activeElements = new Set
    // get elements covered by the provided list of lines
    for (let ln of lines) {

      // skip empty new lines
      if (/^\s*$/.test(editorView.state.doc.line(ln + 1).text)) continue

      // find match
      let elems = preview.querySelectorAll(`[data-line="${ln}"]`)
      // hunt for the first line number that maches
      while (!elems.length && ln >= 0) {
        ln--
        elems = preview.querySelectorAll(`[data-line="${ln}"]`)
      }

      let curElem = elems[elems.length - 1]
      if (!curElem) continue

      // if our direct match has no siblings, highlight it
      if (!activeExclude.includes(curElem.tagName) && !hasSiblings(curElem, ln))
        activeElements.add(curElem)
      // else, use first ancestor that has no siblings of the same line number
      else while(curElem.parentElement && curElem.parentElement !== preview) {
        curElem = curElem.parentElement
        if (!activeExclude.includes(curElem.tagName) && !hasSiblings(curElem, ln)) {
          activeElements.add(curElem)
          break
        }
      }

      // add last ancestor to match
      while(curElem.parentElement && curElem.parentElement !== preview)
        curElem = curElem.parentElement
      if (curElem.parentElement && !activeExclude.includes(curElem.tagName)) 
        activeElements.add(curElem)
    }
  })

  function getActiveElementStyle(target: Element) {
    if (!preview || !target) return
    const parentRect = previewContainer.getBoundingClientRect()
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
    const offsetTop = rect.top - parentRect.top + padding[0] + padding[1] + previewContainer.scrollTop
    const offsetLeft = rect.left - parentRect.left + padding[2] + padding[3]
    return `height: ${height}px; width: ${width}px; top: ${offsetTop}px; left: ${offsetLeft}px;`
  }

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
    // rather than replace the whole tree we just replace what's changed using MorphDOM
    await idleCallback(async () => {
      await morphMarkdown(editorView.state.doc.toString(), preview)
      scrollMapNeedsUpdate = true
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
    const domRect = editor.getBoundingClientRect()
    const pos = editorView.posAtCoords({ x: domRect.x, y: domRect.y })
    let line = editorView.state.doc.lineAt(pos ?? 1).number - 1
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
      const diff = (scrollTop - heightAtLine(curLine + 1)) * 0.75
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

  .editor
    height: 100%

  .settings-menu
    display: flex
    flex-direction: column
    width: max-content
    font-set('display')
    font-size: 0.9rem

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

  .active-element
    position: absolute
    box-shadow: 0 0 1rem 0.25rem colvar('text-select', opacity 0.075)
    border-radius: 0.25rem
    background: colvar('text-select', opacity 0.075)
    pointer-events: none
    user-select: none
    z-index: 1

</style>

<!-- some chores to do on resize -->
<svelte:window on:resize={updatePreview}/>

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
      in:tnAnime={{ translateX: ['-200%', '0'], duration: 800, delay: 300, easing: 'easeOutExpo' }}
      out:tnAnime={{ translateX: '-600%', duration: 200, delay: 50, easing: 'easeInExpo' }}
    >
      <div class='editor-settings'>
        <DetailsMenu i='fluent:settings-28-filled' label='Editor Settings'>
          <div class='settings-menu'>
            <Toggle bind:toggled={editorDarkMode}>Dark Mode</Toggle>
            <Toggle bind:toggled={editorSpellCheck}>Spellcheck</Toggle>
            <Toggle bind:toggled={editorLivePreview}>Live Preview</Toggle>
          </div>
        </DetailsMenu>
      </div>
      <div class=editor bind:this={editor}/>
    </div>

    <!-- Right | Preview Pane -->
    <div class='preview {previewDarkMode ? 'dark' : 'light'} codetheme-dark' bind:this={previewContainer}
      on:scroll={scrollFromPreview} 
      on:touchstart={() => scrollingWith = 'preview'} on:wheel={() => scrollingWith = 'preview'}
      in:tnAnime={{ translateX: ['-300%', '0'], duration: 900, delay: 350, easing: 'easeOutQuint' }}
      out:tnAnime={{ translateX: '-300%', duration: 150, easing: 'easeInQuint' }}
    >
      {#if containerClass === 'show-both' || containerClass === 'show-preview'}
        {#each Array.from(activeElements) as elem (elem)}
          <div class=active-element transition:fade={{duration: 100}} style={getActiveElementStyle(elem)} />
        {/each}
        <div class='preview-settings'>
          <DetailsMenu i='fluent:settings-28-filled' label='Preview Settings'>
            <div class='settings-menu'>
              <Toggle bind:toggled={previewDarkMode}>Dark Mode</Toggle>
              <Toggle bind:toggled={previewActiveLine}>Show Active Line</Toggle>
            </div>
          </DetailsMenu>
        </div>
        <div class=rhythm bind:this={preview}/>
      {/if}
    </div>

  </div>
</div>