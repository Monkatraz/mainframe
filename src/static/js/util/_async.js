'use strict'

/**
 * Returns a promise that resolves after the specified number of miliseconds.
 * @param  {Number} ms Number of miliseconds to wait.
 * @return {Promise}   Promise that fulfills after [ms] seconds.
 */
function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Returns a promise that resolves after requestAnimationFrame fires its callback.
 * @return {Promise} Promise that fufills after requestAnimationFrame fires.
 */
function animationFrame () {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

/**
 * Waits until the specified function returns [true].
 * It will poll either every 200ms, or -
 * it will call the specified async function to determine the polling interval.
 * @param  {Function} conditionFunction  Function that is polled against.
 * @param  {Function} asyncTimerFunction Function used for polling interval. Optional.
 * @return {Promise}                     Resolves to [true] once the conditionFunction resolves to [true].
 */
async function waitFor (conditionFunction, asyncTimerFunction) {
  if (typeof asyncTimerFunction !== 'function') {
    asyncTimerFunction = () => sleep(200)
  }
  while ((await conditionFunction()) === false) {
    await asyncTimerFunction()
    continue
  }
  return true
}

/**
 * Creates a promise with exposed resolve and reject functions.
 * Specifically, Deferred.resolve() and Deferred.reject().
 * @param       {Function} fn Optional argument - allows a function to be executed within the promise as usual.
 * @constructor
 */
function Deferred (fn) {
  let publicResolve, publicReject
  const promise = new Promise((resolve, reject) => {
    publicResolve = resolve
    publicReject = reject
    if (fn) {
      fn(resolve, reject)
    }
  })
  // @ts-ignore
  promise.resolve = publicResolve
  // @ts-ignore
  promise.reject = publicReject
  return promise
}

export { sleep, animationFrame, waitFor, Deferred }
