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
import { ENV, appendScript, appendStylesheet } from "@modules/util"

// Utility Functions
// TODO: Probably replace this with actual error messages
function warnFail() {
  console.warn(`A plugin failed to load.`)
}

/** Adds a `'load', { once: true }` event-listener using the specified function. */
function doOnLoad(fn: AnyFn) {
  window.addEventListener('load', fn, { once: true })
}

// Component Types
import type { SvelteComponent } from 'svelte'
type LoadComponent = [id: string, comp: typeof SvelteComponent, selector: string, props: PlainObject]
// Component Imports
import Page from '@components/Page.svelte'
// Components list
const componentsToLoad: LoadComponent[] = [
  ['Page', Page, '#page', { path: ENV.HOMEPAGE }],
]
// Exported components list
export const Components: { [id: string]: SvelteComponent } = {}
/** Renders each component in the `components` list. */
function renderComponents() {
  componentsToLoad.forEach(([id, comp, selector, props]) => {
    const component = new comp({
      target: document.querySelector(selector) as Element,
      props: props
    })
    if (id) Components[id] = component
  })
}

// DOMContentLoaded
async function onDOMLoaded() {
  // Noncritical CSS
  await appendStylesheet('/static/css/main.css')

  // Components
  renderComponents()

  // Iconify
  appendScript('https://code.iconify.design/2/2.0.0-rc.1/iconify.min.js')
    .catch(warnFail)

  // Prism
  appendScript('/vendor/prism.js').then(() => {
    // Disable automatically firing
    window.Prism.manual = true
    // Divert languages to CDN instead of storing them ourselves
    window.Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.21.0/components/'
  }).catch(warnFail)
}

document.addEventListener('DOMContentLoaded', onDOMLoaded, { once: true })