<script lang='ts'>
  import Icon from './Icon.svelte'
</script>

<style lang='stylus'>
  @require '_lib'

  .sb-container
    font-set('display')

  .sb-buttons
    display: flex
    width: 100%
    align-items: center
    justify-content: space-around
    background: colvar('accent-1', darken 5%)
    padding: 0.5rem 0.5rem

  .sb-header
    padding-top: 0.5rem
    padding-bottom: 0.25rem
    padding-left: 1rem
    border-top: solid 0.125rem colvar('accent-1', lighten 10%, desaturate 40%)
    font-weight: bolder
    color: colvar('text-subtle')

    ~ .sb-header
      margin-top: 0.5rem

  .sb-link, .sb-link-small, .sb-button
    reset-styling(false)
    display: flex
    align-items: center
    line-height: 0
    color: colvar('text')
    white-space: nowrap
    font-size: 1rem
    font-weight: bolder
    transition: background 0.125s

  .sb-button
    gap: 0.5rem
    justify-content: center
    flex-grow: 1
    background: colvar('accent-1')
    height: 2.5rem
    padding: 0 1rem
    margin: 0 0.25rem
    border-radius: 0.25rem

    +on-hover()
      background: colvar('accent-1', lighten 1.25%)

  .sb-link, .sb-link-small
    gap: 0.75rem
    width: 100%
    height: 3em
    padding-left: 1rem

    +on-hover()
      background: rgba(255,255,255,0.125)

  .sb-link-small
    height: 2em
    font-set('display')
    font-weight: 300

</style>
<div class='sb-container' role='presentation'>

  <div class=sb-buttons>
    <a class=sb-button href='/' aria-label='Home'><Icon i='entypo:home' size='1.5em'/></a>
    <a class=sb-button href='/edit'><Icon i='ri:edit-2-fill' size='1.5em'/>Open Editor</a>
  </div>

  <div class=sb-header>About</div>
  <a class=sb-link
    href='https://github.com/Monkatraz/mainframe'><Icon i='mdi:github' size='2em'/> Source Repository</a>
  <a class=sb-link href='http://www.scpwiki.com/'><Icon i='@c:scp:logo' size='2em'/> SCP Wiki</a>

  <div class=sb-header>Resources</div>
  <a class=sb-link href='/guide/editor-syntax'><Icon i='entypo:code' size='2em'/> Editor Syntax</a>
  <a class=sb-link href='/guide/modules'><Icon i='ph:stack-simple-bold' size='2em'/> Modules</a>
  <a class=sb-link href='/guide/api'><Icon i='carbon:cloud-app' size='2em'/> Mainframe API</a>

  <div class=sb-header>Customization</div>
  <a class=sb-link href='/guide/theming'><Icon i='mdi:palette' size='2em'/> User Themes</a>
  <a class=sb-link href='/guide/modules'><Icon i='ph:stack-bold' size='2em'/> User Modules</a>

  <div class=sb-header>Test Pages</div>
  <a class=sb-link-small href='/test/md'><Icon i='ion:logo-markdown' size='1.25em'/> Markdown</a>
  <a class=sb-link-small href='/test/loading'><Icon i='ion:hourglass' size='1.25em'/> Loading Spinner</a>

  <div class=sb-header>Articles</div>
  <a class=sb-link-small href='/scp/3685'><Icon i='ic:round-article' size='1.25em'/> SCP-3685</a>
  <a class=sb-link-small href='/scp/173'><Icon i='ic:round-article' size='1.25em'/> SCP-173</a>
</div>