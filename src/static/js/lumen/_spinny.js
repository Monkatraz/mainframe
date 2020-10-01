'use strict'

/**
 * Starts or stops a loading spinner on the selected element.
 * @param {Element}  elem     Affected element.
 * @param {Boolean}  state    Start or stop the spinner. Defaults to [true].
 * @param {String}   width    Size of the spinner, specified using a width. Defaults to ['120px'].
 * @param {Array}    position XY pos. of the spinner, using an array of two strings. Defaults to ['50%', '50%']
 */
function setSpinny (
  elem,
  state = true,
  width = '120px',
  position = ['50%', '50%']
) {
  const curState = elem.getAttribute('data-spinnystate') === '1'
  if (state === curState) return

  if (state === true) {
    // Create our element
    const img = document.createElement('img')
    img.className = 'spinny'
    img.src = '/static/media/spinner.svg'

    // Set the CSS
    const cssText =
      'position: absolute;' +
      `top: ${position[0]}; left: ${position[1]};` +
      'z-index: 999;' +
      `width: ${width};` +
      'transform: translate(-50%, -50%);' +
      'opacity: 0;' +
      'transition: opacity 0.25s;' +
      'pointer-events: none;'

    img.style.cssText = cssText

    // Add to DOM
    elem.appendChild(img)
    elem.setAttribute('data-spinnystate', '1')
    requestAnimationFrame(() => {
      img.style.opacity = '1'
    })
  } else {
    const img = elem.querySelector('img.spinny')
    // @ts-ignore
    img.style.opacity = '0'
    // Remove after fadeout
    setTimeout(() => {
      elem.removeChild(img)
    }, 300)
    elem.removeAttribute('data-spinnystate')
  }
}

export { setSpinny }
