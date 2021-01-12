<script lang='ts'>
  import Icon from '../Icon.svelte'
  import Link from './Link.svelte'
  import Social from './Social.svelte'
</script>

<style lang='stylus'>
  @require '_lib'

  .sb-container
    overflow-y: scroll
    overflow-x: hidden
    height: 100%
    hide-scrollbars()
    font-set('display')


  .sb-buttons
    display: flex
    flex-wrap: wrap
    align-items: center
    justify-content: space-around
    padding: 0.5rem 0.5rem
    background: colvar('accent-1', darken 5%)

  .sb-socials
    display: flex
    align-items: center
    justify-content: space-evenly
    height: 2.5rem
    margin: 0 0.25rem
    padding: 0.5rem
    padding-bottom: 0
    border-top: solid 0.125rem colvar('accent-1', lighten 10%, desaturate 40%)

  .sb-header
    margin-top: 0.5rem
    padding-top: 0.5rem
    padding-bottom: 0.25rem
    padding-left: 1rem
    border-top: solid 0.125rem colvar('accent-1', lighten 10%, desaturate 40%)
    font-weight: bolder
    color: colvar('text-subtle')

  .sb-button
    reset-styling(false)
    display: flex
    align-items: center
    justify-content: center
    flex-grow: 1
    gap: 0.5rem
    height: 2.5rem
    margin: 0 0.25rem
    padding: 0 1rem
    font-size: 1rem
    font-weight: bolder
    color: colvar('text')
    background: colvar('accent-1')
    border-radius: 0.25rem
    transition: background 0.125s

    +on-hover()
      background: colvar('accent-1', lighten 1.25%)

</style>
<div class='sb-container' role='presentation'>

  <div class=sb-buttons>
    <a class=sb-button href='/' aria-label='Home'><Icon i='entypo:home' size='1.5em'/></a>
    <a class=sb-button href='/edit'><Icon i='ri:edit-2-fill' size='1.5em'/>Open Editor</a>
  </div>

  <div class=sb-socials>
    <Social label='SCP DeviantArt' 
      href='https://scp-foundation.deviantart.com/'
      src='/static/media/social-deviantart.png' />

    <Social label='SCP Facebook' 
      href='https://www.facebook.com/scpfoundation'
      src='/static/media/social-facebook.png' />

    <Social label='SCP Subreddit'
      href='https://www.reddit.com/r/SCP'
      src='/static/media/social-reddit.png' />

    <Social label='SCP Tumblr'
      href='https://scp-wiki-official.tumblr.com/'
      src='/static/media/social-tumblr.png' />

    <Social label='SCP Instagram'
      href='https://www.instagram.com/scpfoundationwiki'
      src='/static/media/social-instagram.png' />

    <Social label='SCP Twitch'
      href='https://www.twitch.tv/scpwiki'
      src='/static/media/social-twitch.png' />
  </div>

  <div class=sb-header>About</div>
  <Link href='https://github.com/Monkatraz/mainframe' i='mdi:github'>Source Repository</Link>
  <Link href='http://www.scpwiki.com/' i='@c:scp:logo'>Official SCP Wiki</Link>
  <Link href='/admin/license' i='tabler:copyright'>Licensing</Link>
  <Link href='/admin/contributors' i='clarity:heart-line'>Contributors</Link>

  <div class=sb-header>Resources</div>
  <Link href='/guide/editor-syntax' i='entypo:code'>Editor Syntax</Link>
  <Link href='/guide/modules' i='ph:stack-simple-bold'>Modules</Link>
  <Link href='/guide/api' i='carbon:cloud-app'>Mainframe API</Link>

  <div class=sb-header>Customization</div>
  <Link href='/guide/user-themes' i='mdi:palette-outline'>User Themes</Link>
  <Link href='/guide/user-modules' i='ph:stack-bold'>User Modules</Link>

  <div class=sb-header>Test Pages</div>
  <Link href='/test/md' i='ion:logo-markdown' small>Markdown</Link>
  <Link href='/test/loading' i='ion:hourglass' small>Loading Spinner</Link>

  <div class=sb-header>Articles</div>
  <Link href='/scp/3685' i='ic:round-article' small>SCP-3685</Link>
  <Link href='/scp/173' i='ic:round-article' small>SCP-173</Link>
</div>