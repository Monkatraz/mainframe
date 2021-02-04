<script lang='ts'>
  import { getContext } from 'svelte'
  import type { EditorCore } from './editor-core'

  const Editor = getContext<EditorCore>('editor')

  // https://stackoverflow.com/a/12205668
  function byteCount(str: string) {
    return encodeURI(str).split(/&..|./).length - 1
  }

  // https://stackoverflow.com/a/18679657
  function wordCount(str: string) {
    return str.trim().split(/\s+/).length
  }

</script>

<div class='ed-st fs-mono tx-dim'>
  <div class='ed-st-row'>
    <span>CHARS <span>{$Editor.value.length}</span></span>
    <span>WORDS <span>{wordCount($Editor.value)}</span></span>
  </div>
  <div class='ed-st-row'>
    <span>BYTES <span>{Math.round(byteCount($Editor.value) / 1000)}KB</span></span>
  </div>
</div>

<style lang='stylus'>
  @require '_lib'

  .ed-st-row
    display: flex
    flex-direction: row
    height: 100%
    margin: 0 0.075rem
    font-size: 0.75rem
    line-height: 1.25

    > span
      margin: 0rem 0.25rem

      > span
        color: colvar('text-subtle')

</style>
