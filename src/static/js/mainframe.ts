/**
 * @author Monkatraz
 */
// Imports
import { appendScript, evtlistener } from "@modules/util"

/** Function for handling the `.touch` pseudo-psuedo CSS class.
 *  It runs on every `Document` touch event, and acts much like a pointerevent.
 */
function touchClassHandle(evt: TouchEvent) {
  // In English:
  // For every touch, get its target, and all of the target's parent nodes.
  // Then, merge them into an array of unique elements.
  let touchedElems: Element[] = []
  for (let i = 0; i < evt.touches.length; i++) {
    const touch = evt.touches[i]
    const elems = []
    let curElem = touch.target as Element | null
    while (curElem) {
      elems.unshift(curElem)
      curElem = curElem.parentElement
    }
    // VERY cryptic one liner, but this is basically a union function.
    // Merge both arrays, then create a set.
    // Then convert the set back into an array, with another [...]
    // Sets only contain unique values, so that's why this works.
    touchedElems = [...new Set([...touchedElems, ...elems])]
  }

  // Here, we set our classes.
  requestAnimationFrame(() => {
    // Clear all of our touch classes
    document.querySelectorAll('.touch').forEach((elem) => {
      elem.classList.toggle('touch', false)
    })

    // Add touch classes to all elements in touchedElems
    touchedElems.forEach((elem) => {
      elem.classList.toggle('touch', true)
    })
  })
}

// Something to note is that for externally loaded scripts (like Iconify or Prism auto-DL languages) -
// is that their source domains need to be exempted in the CSP. This can be adjusted in `netlify.toml`.
function loadVendorScripts() {
  // Prism
  appendScript('/vendor/prism.js').then(() => {
    // Disable automatically firing
    window.Prism.manual = true
    // Divert languages to CDN instead of storing them ourselves
    window.Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.21.0/components/'
  }).catch(() => { console.warn(`Prism failed to load.`) })
}

// -----
//  APP

import AppComponent from '@components/App.svelte'
const App = new AppComponent({ target: document.querySelector('#app') as HTMLElement })

// -----------
//  LOAD/INIT

function finalizeLoading() {
  loadVendorScripts()
  evtlistener(document, ['touchstart', 'touchend', 'touchcancel'], touchClassHandle)
  // Goofy thing for making a placeholder img for the logo work.
  const emblem = document.querySelector('#logo_emblem') as HTMLImageElement
  if (emblem.complete) emblem.classList.add('loaded')
  else emblem.onload = () => emblem.classList.add('loaded')
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', finalizeLoading, { once: true })
else finalizeLoading()