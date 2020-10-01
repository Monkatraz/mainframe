'use strict'
// Contains all of our media size query functionality.
// You can listen to media size change events with the 'MF_MediaSizeChanged' event.
const sizeMap = new Map()
const sizes = ['narrow', 'thin', 'small', 'normal', 'wide']
let curSize = 'thin'
const sizeMediaEvent = new Event('MF_MediaSizeChanged')

// 'narrow' is not included, as it is simply the default size.
const sizeQueries = {
  thin: window.matchMedia('(min-width: 400px)'),
  small: window.matchMedia('(min-width: 800px)'),
  normal: window.matchMedia('(min-width: 1000px)'),
  wide: window.matchMedia('(min-width: 1400px)')
}

// This makes our map associated both ways:
// 0 = thin, thin = 0.
for (let i = 0; i < sizes.length; i++) {
  sizeMap.set(sizes[i], i)
  sizeMap.set(i, sizes[i])
}

// Sets curSize the maximum valid size of the screen.
// It then calls the 'MF_MediaSizeChanged' event.
function updateSize () {
  for (var i = 1; i < sizes.length; i++) {
    if (sizeQueries[sizes[i]].matches === false) {
      curSize = sizeMap.get(i - 1)
      break
    } else {
      curSize = sizeMap.get(sizes.length - 1)
    }
  }
  window.dispatchEvent(sizeMediaEvent)
}
updateSize()

// Add our event listeners, so that no polling is needed.
for (const size in sizeQueries) {
  sizeQueries[size].addEventListener('change', updateSize)
}

/**
 * Checks if the specified size matches against the inclusivity operator.
 * For example: matches('narrow', 'only')
 * This will be true only if we're entirely with the bounds of 'narrow'.
 * @param  {String} size 'narrow'|'thin'|'small'|'normal'|'wide'.
 * @param  {String} [inclusivity='only'] 'only'|'up'|'below'.
 * @return {Boolean}
 */
function matches (size, inclusivity = 'only') {
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
  return false
}
export { matches, curSize }
