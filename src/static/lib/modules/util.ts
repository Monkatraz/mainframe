/**
 * @file Utility functions and objects.
 * @author Monkatraz
 */

// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0#gistcomment-2694461
/** Very quickly generates a (non-secure) hash from the given string. */
export function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++)
  	h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return h
}

/** Returns a promise that resolves after the specified number of miliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Creates and returns a promise that resolves when an invokation of `requestAnimationFrame()` fires its callback. */
export function animationFrame(): Promise<number> {
  return new Promise(resolve => requestAnimationFrame(resolve))
}

// Credit: https://gist.github.com/beaucharman/e46b8e4d03ef30480d7f4db5a78498ca
// Personally, I think this is one of the more elegant JS throttle functions.
/** Returns a 'throttled' variant of the given function.
 *  This function will only be able to execute every `limitMS` ms.
 *  Use to rate-limit functions for performance.
 *  You can have the first call be immediate by providing the third parameter as `true`. */
export function throttle<T extends WrappedFn<NoReturnVal>>(fn: T, limitMS: number, immediate = false) {
  let timeout: number | null = null
  let initialCall = true

  return function (this: any, ...args: Parameters<T>) {
    const callNow = immediate && initialCall
    const next = () => {
      void fn.apply(this, [...args as any])
      timeout = null
    }
    if (callNow) {
      initialCall = false
      next()
    }
    if (!timeout) timeout = setTimeout(next, limitMS) as unknown as number
  }
}

// Credit: https://gist.github.com/vincentorback/9649034
/** Returns a 'debounced' variant of the given function. */
export function debounce<T extends WrappedFn<NoReturnVal>>(fn: T, wait = 1) {
  let timeout: any
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => void fn.call(this, ...args), wait)
  }
}

/** Waits until the specified function returns `true`.
 *  It will call the specified async function to determine the polling interval.
 *  If none is given, it will poll every 100ms. */
export async function waitFor(
  conditionFn: () => Promisable<boolean>,
  asyncTimerFn: () => Promise<void> = () => sleep(100)
) {
  while ((await conditionFn()) === false) {
    await asyncTimerFn()
    continue
  }
  return true
}

/** Returns a new 'locked' async function, constructed using the specified function.
 *  A locked asynchronous function will only allow a singular instance of itself to be running at one time.
 *  Additional calls to the function will cause the async. function to wait until they can be ran. */
export function createLock<T extends WrappedPromiseFn<any>>(fn: T) {
  let locked: boolean
  return async (...args: Parameters<T>) => {
    if (locked) await waitFor(() => locked === false)
    locked = true
    // Makes sure that the return type shown is correct
    type resultType = ReturnType<T> extends PromiseLike<infer U> ? U : ReturnType<T>
    const result = await fn(...args as any) as resultType
    locked = false
    return result
  }
}

/** Returns a function that will be "queued" to execute only on animation frames.
 *  Calling this function multiple times will have it run only once on the next requestAnimationFrame.
 *  The function cannot return anything - this function is async but without promises.
 *  @example
 *  const coolFunc = createAnimQueued(function niceFunc(args) => { 'stuff' })
 *  coolFunc()
 *  coolFunc() // doesn't run as the previous call is already queued */
export function createAnimQueued<T extends WrappedFn<NoReturnVal>>(fn: T) {
  let queued: boolean
  return (...args: Parameters<T>): NoReturnVal => {
    if (queued !== true) {
      queued = true
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      requestAnimationFrame(async () => {
        await fn(...args as any)
        queued = false
      })
    }
  }
}

const HAS_IDLE_CALLBACK = 'requestIdleCallback' in window

/** Safely calls `requestIdleCallback` in an awaitable `Promise`. */
export function idleCallback<T extends AnyFn<any>>(cb: T, timeout = 100): Promise<ReturnType<T>> {
  if (!HAS_IDLE_CALLBACK) return new Promise(resolve => setTimeout(() => resolve(cb()), timeout))
  else return new Promise(resolve => (window as any).requestIdleCallback(() => resolve(cb()), { timeout }))
}

/** See `createAnimQueued` for a description of how this function works.
 *  The only difference is that this function uses `requestIdleCallback` instead.
 *  If `requestIdleCallback` isn't available, it will use `createAnimQueued` instead.
 * @see createAnimQueued */
export function createIdleQueued<T extends WrappedFn<NoReturnVal>>(fn: T, timeout = 100) {
  if (!HAS_IDLE_CALLBACK) return createAnimQueued(fn)
  let queued: boolean
  return (...args: Parameters<T>): NoReturnVal => {
    if (queued !== true) {
      queued = true;
      (window as any).requestIdleCallback(async () => {
        await fn(...args as any)
        queued = false
      }, { timeout })
    }
  }
}

/** Helper function for creating event listeners. */
export function evtlistener(target: typeof window | typeof document | Element, events: string[], fn: AnyFn, opts: AddEventListenerOptions = {}) {
  events.forEach((event) => {
    target.addEventListener(event, fn, opts)
  })
}

/** Helper function for removing event listeners. */
export function rmEvtlistener(target: typeof window | typeof document | Element, events: string[], fn: AnyFn, opts: AddEventListenerOptions = {}) {
  events.forEach((event) => {
    target.removeEventListener(event, fn, opts)
  })
}
