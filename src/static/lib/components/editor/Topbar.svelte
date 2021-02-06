<script lang='ts'>
  import { settings, EditorCore } from './editor-core'
  import { getContext } from 'svelte'
  import { matchMedia, focusGroup, toast, Button, TextInput } from '@components'

  const Editor = getContext<EditorCore>('editor')

  async function save() {
    const success = await Editor.saveLocally()
    if (success) toast('success', `Saved! (${Editor.draft.name})`)
    else if (!Editor.draft.name) toast('danger', 'Failed to save: Draft has no name.')
    else toast('danger', 'Failed to save - please try again.')
  }

  // https://stackoverflow.com/a/12205668
  function byteCount(str: string) {
    return encodeURI(str).split(/&..|./).length - 1
  }

  // https://stackoverflow.com/a/18679657
  function wordCount(str: string) {
    return str.trim().split(/\s+/).length
  }

</script>

<div class='topbar' use:focusGroup={'horizontal'}>
  <div class='flex flex-grow fs-display divide-x-1'>
    {#if $matchMedia('small', 'up')}
      <div class='flex pr-2'>
        <TextInput bind:value={$Editor.draft.name} thin placeholder='Draft name...' />
        <span class='mr-2' />
        <Button i='carbon:save' tip='Save Draft Locally' size='1.5rem' baseline
          on:click={save}/>
        <Button i='carbon:data-base' tip='Manage Drafts' size='1.5rem' baseline/>
      </div>
      <div class='flex leading-tight fs-xs fs-mono pl-3'>
        <div class='flex-column tx-dim mr-2'>
          <span>CHARS</span>
          <span>BYTES</span>
        </div>
        <div class='flex-column tx-subtle mr-3'>
          <span>{$Editor.value.length}</span>
          <span>{Math.round(byteCount($Editor.value) / 1000)}KB</span>
        </div>
        <div class='flex-column tx-dim mr-2'>
          <span>WORDS</span>
          <span>LINES</span>
        </div>
        <div class='flex-column tx-subtle'>
          <span>{wordCount($Editor.value)}</span>
          <span>{$Editor.doc.lines}</span>
        </div>
      </div>
    {:else}
    <div class='flex w-full align-center justify-between'>
      <TextInput bind:value={$Editor.draft.name} thin placeholder='Draft name...' />
      <div class='flex-grow ml-3 mr-2'>
        <Button compact primary wide on:click={save}>Save Draft</Button>
      </div>
      <Button i='carbon:data-base' tip='Manage Drafts' size='1.5rem' baseline/>
    </div>
    {/if}
  </div>
  {#if $matchMedia('small', 'up')}
    {#if $settings.preview.enable}
      <Button i='fluent:caret-right-24-filled' tip='Close Preview' size='1.75rem' baseline
        on:click={() => $settings.preview.enable = false} />
    {:else}
      <Button i='fluent:caret-left-24-filled' tip='Open Preview' size='1.75rem' baseline
        on:click={() => $settings.preview.enable = true} />
    {/if}
  {/if}
</div>

<style lang='stylus'>
  @require '_lib'

  .topbar
    display: flex
    justify-content: space-between
    width: 100%
    padding: 0.125rem 0.5rem
    padding-right: 0
    font-size: 0.875rem
    background: var(--colcode-background)

</style>

