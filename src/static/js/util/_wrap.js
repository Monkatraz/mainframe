'use strict'
/**
 * Returns a new 'locked' async function, constructed using the specified function.
 * A locked asynchronous function will only allow a singular instance of itself to be running at one time.
 */
function createLock (func) {
  var locked
  return async (...args) => {
    if (locked !== true) {
      locked = true
      await func(...args)
      locked = false
    }
  }
}
/**
 * Returns a function that will be "queued" to execute only on animation frames.
 * Calling this function multiple times will have it run only once on the next requestAnimationFrame.
 */
function createAnimQueued (func) {
  var queued
  return (...args) => {
    if (queued !== true) {
      queued = true
      requestAnimationFrame(() => {
        func(...args)
        queued = false
      })
    }
  }
}
export { createLock, createAnimQueued }
