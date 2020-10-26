/**
 * @author Monkatraz
 */
// Imports
import { appendScript, appendStylesheet, evtlistener } from "@modules/util"

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

// UserClient object for getting processed info about the state of the page
// Like a 0-1 ratio for how scrolled the page is, or 0-1 mouseX and mouseY
export const UserClient = {
  // Values
  mouseX: 0,
  mouseY: 0,
  scroll: 0,
  // Flags
  isMobile: /Mobi|Android/i.test(navigator.userAgent),

  updateMouseCoordinates(evt: MouseEvent) {
    const normX = evt.clientX / window.innerWidth
    const normY = evt.clientY / window.innerHeight
    UserClient.mouseX = normX
    UserClient.mouseY = normY
  },

  updateScrollRatio() {
    const body = document.body
    const root = document.documentElement
    UserClient.scroll = root.scrollTop / (body.scrollHeight - root.clientHeight)
  }
}

// Goofy thing for making a placeholder img for the logo work, compat. with CSP.
const emblem = document.querySelector('#logo_emblem') as any
emblem.onload = emblem.classList.add('loaded')


// This section is a tad messy.
// Its job is to load the various plugins and things the site uses.
// It loads things in a certain order and priority.
// It's nothing special though - it is mostly just appending scripts and stylesheets.
// Dynamic imports using `import()` are not used.
//
// Something to note is that for externally loaded scripts (like Iconify or Prism auto-DL languages) -
// is that their source domains need to be exempted in the CSP. This can be adjusted in `netlify.toml`.

// Utility Functions
function warnFail() {
  console.warn(`A plugin failed to load.`)
}

// DOMContentLoaded
function onDOMLoaded() {
  // Noncritical CSS
  appendStylesheet('/static/css/main.css')

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

// Init. everything
document.addEventListener('DOMContentLoaded', () => {
  // Touch class
  evtlistener(document, ['touchstart', 'touchend', 'touchcancel'], touchClassHandle)
  // UserClient
  evtlistener(window, ['mousemove'], UserClient.updateMouseCoordinates)
  evtlistener(window, ['scroll'], UserClient.updateScrollRatio)
  // Load remote
  onDOMLoaded()
}, { once: true })