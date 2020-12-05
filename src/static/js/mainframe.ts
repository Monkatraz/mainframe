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

// Goofy thing for making a placeholder img for the logo work.
const emblem = document.querySelector('#logo_emblem') as any
emblem.onload = emblem.classList.add('loaded')

// Finalize loading content, inject non-critical CSS.
// Something to note is that for externally loaded scripts (like Iconify or Prism auto-DL languages) -
// is that their source domains need to be exempted in the CSP. This can be adjusted in `netlify.toml`.
function finalizeLoad() {
  // TODO: Find a cleaner way to load these (Skypack? Async Defer?)
  // Iconify
  appendScript('https://code.iconify.design/2/2.0.0-rc.1/iconify.min.js')
    .catch(() => { console.warn(`Iconify failed to load.`) })

  // Prism
  appendScript('/vendor/prism.js').then(() => {
    // Disable automatically firing
    window.Prism.manual = true
    // Divert languages to CDN instead of storing them ourselves
    window.Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.21.0/components/'
  }).catch(() => { console.warn(`Prism failed to load.`) })
}

// ----------------
//   MEDIA QUERIES

const sizeMap = new Map()
const sizes = ['narrow', 'thin', 'small', 'normal', 'wide'] as const

// This makes our map associated both ways:
// 0 = thin, thin = 0.
sizes.forEach((size: string, i) => {
  sizeMap.set(size, i)
  sizeMap.set(i, size)
})

/** Contains the media queries for the window size breakpoints.
 *  Narrow is not included as it is the default size if none of the others are valid.
 */
const sizeQueries = {
  thin: window.matchMedia('(min-width: 400px)'),
  small: window.matchMedia('(min-width: 800px)'),
  normal: window.matchMedia('(min-width: 1000px)'),
  wide: window.matchMedia('(min-width: 1400px)')
}

let curSize = 'thin'
/** Updates the `curSize` variable with the current window size. */
function updateSize() {
  for (let i = 1; i < sizes.length; i++) {
    if (sizeQueries[sizes[i] as keyof typeof sizeQueries].matches === false) {
      curSize = sizeMap.get(i - 1)
      break
    } else {
      curSize = sizeMap.get(sizes.length - 1)
    }
  }
  window.dispatchEvent(new Event('MF_MediaSizeChanged'))
}

// Add our event listeners, so that no polling is needed.
for (const size in sizeQueries) {
  sizeQueries[size as keyof typeof sizeQueries].addEventListener('change', updateSize)
}

/**
 * Checks if the specified size matches against the inclusivity operator.
 * For example: matches('narrow', 'only')
 * This will be true only if we're entirely with the bounds of 'narrow'.
 */
export function matchMedia(
  size: 'narrow' | 'thin' | 'small' | 'normal' | 'wide',
  inclusivity: 'only' | 'up' | 'below' = 'only') {
  // Our size map means this function is relatively simple.
  // Larger sizes have their mapped integer higher than the previous.
  // We can use this to compare curSize to our specified size.
  switch (inclusivity) {
    case 'only':
      return curSize === size
    case 'up':
      return sizeMap.get(curSize) >= sizeMap.get(size)
    case 'below':
      return sizeMap.get(curSize) < sizeMap.get(size)
  }
}

// ---------
//   STATE

/** Browser / User-Agent info. Contains contextual information like normalized mouse position values. */
// TODO: Change this to a namespace
export const Agent = {
  // Values
  mouseX: 0,
  mouseY: 0,
  scroll: 0,
  // Flags
  isMobile: /Mobi|Android/i.test(navigator.userAgent),

  updateMouseCoordinates(evt: MouseEvent) {
    const normX = evt.clientX / window.innerWidth
    const normY = evt.clientY / window.innerHeight
    Agent.mouseX = normX
    Agent.mouseY = normY
  },

  updateScrollRatio() {
    const body = document.body
    const root = document.documentElement
    Agent.scroll = root.scrollTop / (body.scrollHeight - window.innerHeight)
  }
}

/** Represents the current user - regardless of if they are logged in or not. */
export const User = {
  isLoggedIn: false,
  username: 'Guest',
  // FaunaDB User Auth
  auth: {
    // The amount of sensitive data here should be minimized as much as possible
    ref: '',
    token: ''
  },
  // LocalStorage preferences
  preferences: {
    langs: ['en']
  },
  // TODO: Logging in / out
  login(email: string, password: string) {
    User.isLoggedIn = true
  },
  logout() {
    User.isLoggedIn = false
  }
}

// -----
//  APP

import AppComponent from '@components/App.svelte'
const App = new AppComponent({ target: document.querySelector('#app') as HTMLElement })

// -- Router
import page from 'page'
// -- Router Paths
// page('/', () => { Components['Page'].$set({ path: 'scp/3685' }) })
// Finalize the router setup
page()

// Init. everything
document.addEventListener('DOMContentLoaded', () => {
  finalizeLoad()
  updateSize()
  evtlistener(document, ['touchstart', 'touchend', 'touchcancel'], touchClassHandle)
  evtlistener(window, ['mousemove'], Agent.updateMouseCoordinates)
  evtlistener(window, ['scroll'], Agent.updateScrollRatio)
}, { once: true })