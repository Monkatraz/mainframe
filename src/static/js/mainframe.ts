/**
 * @author Monkatraz
 */

/** Function for handling the `.touch` pseudo-psuedo CSS class.
 *  It runs on every `Document` touch event, and acts much like a pointerevent.
 */
export function touchClassHandle(evt: TouchEvent) {
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

// Goofy thing for making a placeholder img for the logo work, compat. with CSP.
const emblem = document.querySelector('#logo_emblem') as any
emblem.onload = emblem.classList.add('loaded')

document.addEventListener('DOMContentLoaded', () => {
  // Touch class
  document.addEventListener('touchstart', touchClassHandle)
  document.addEventListener('touchend', touchClassHandle)
  document.addEventListener('touchcancel', touchClassHandle)
}, { once: true })