/**
 * This file will be a bit messier than the others.
 * Its job is to load the various plugins and things the site uses.
 * It loads things in a certain order and priority.
 * It's nothing special though - it is mostly just appending scripts and stylesheets.
 * Dynamic imports using `import()` are not used.
 *
 * Something to note is that for externally loaded scripts (like Iconify or Prism languages) -
 * is that their source domains need to be exempted in the CSP. This can be adjusted in `netlify.toml`.
 *
 * @file Begins the loading of various modules and dependencies as the page loads.
 * @author Monkatraz
 */
// Imports
import { appendScript, appendStylesheet } from "@modules/util"
// Svelte Components
import Page from '@components/Page.svelte'

// Utility Functions
// TODO: Probably replace this with actual error messages
function warnFail() {
  console.warn(`A plugin failed to load.`)
}

/** Adds a `'load', { once: true }` event-listener using the specified function. */
function doOnLoad(fn: AnyFn) {
  window.addEventListener('load', fn, { once: true })
}

// DOMContentLoaded
function onDOMLoaded() {
  // Noncritical CSS
  appendStylesheet('/static/css/main.css').then(() => {
    // Reveals content once styling has loaded
    document.documentElement.classList.add('page-loaded')
  })

  // Components
  // TODO: load components here
  const PageComponent = new Page({
    target: document.querySelector('#page') as Element,
    intro: true,
    props: {
      path: 'scp/3685'
    }
  })

  // Iconify
  appendScript('https://code.iconify.design/2/2.0.0-rc.1/iconify.min.js')
    .catch(warnFail)

  // Prism
  appendScript('/vendor/prism.js').then(() => {
    // Disable automatically firing
    window.Prism.manual = true
    // Divert languages to CDN instead of storing them ourselves
    window.Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.21.0/components/'
    // Highlight on page load
    doOnLoad(() => window.Prism.highlightAll())
  }).catch(warnFail)
}

document.addEventListener('DOMContentLoaded', onDOMLoaded, { once: true })