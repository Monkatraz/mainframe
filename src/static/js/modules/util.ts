/**
 * @file Utility functions and objects.
 * @author Monkatraz
 */

/** Contains all "environment" variables.
 *  They're just inlined in the code because that is what Snowpack would've done anyways.
 */
export const ENV = {
  /** API related env. variables. Usually database related. */
  API: {
    // Database
    FDB_PUBLIC: 'fnAD335_NTACBv7ohiYXzvekkToWGGfdNKnaI3XB',
    FDB_DOMAIN: 'db.fauna.com',
    // Serverless functions
    LAMBDA: '/api/'
  },
  HOMEPAGE: '/scp/6842'
}

/** Browser / User-Agent info. Contains contextual information like normalized mouse position values. */
export namespace Agent {
  // State
  export let mouseX = 0
  export let mouseY = 0
  export let scroll = 0
  // Flags
  export const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  // Set up our listeners
  window.addEventListener('mousemove', (evt) => {
    mouseX = evt.clientX / window.innerWidth
    mouseY = evt.clientY / window.innerHeight
  })

  window.addEventListener('scroll', () => {
    scroll = document.documentElement.scrollTop / (document.body.scrollHeight - window.innerHeight)
  })
}

/**
 * Returns a promise that resolves after the specified number of miliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Creates and returns a promise that resolves when an invokation of `requestAnimationFrame()` fires its callback.
 */
export function animationFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve))
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
      fn.apply(this, [...args as any])
      timeout = null
    }
    if (callNow) {
      initialCall = false
      next()
    }
    if (!timeout) timeout = setTimeout(next, limitMS) as unknown as number
  }
}

/**
 * Waits until the specified function returns `true`.
 * It will poll either every 200ms, or -
 * it will call the specified async function to determine the polling interval.
 * @param  conditionFn  Optionally async. function that is polled against.
 * @param  asyncTimerFn Async. function that provides the polling interval.
 */
export async function waitFor(
  conditionFn: () => Promisable<boolean>,
  asyncTimerFn?: () => Promise<void>
) {
  if (typeof asyncTimerFn !== 'function')
    asyncTimerFn = () => sleep(100)

  while ((await conditionFn()) === false) {
    await asyncTimerFn()
    continue
  }
  return true
}

/**
 * Returns a new 'locked' async function, constructed using the specified function.
 * A locked asynchronous function will only allow a singular instance of itself to be running at one time.
 * Additional calls to the function will cause the async. function to wait until they can be ran.
 */
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

/**
 * Returns a function that will be "queued" to execute only on animation frames.
 * Calling this function multiple times will have it run only once on the next requestAnimationFrame.
 * The function cannot return anything - this function is async but without promises.
 * @example
 * const coolFunc = createAnimQueued(function niceFunc(args) => { 'stuff' })
 * coolFunc()
 * coolFunc() // doesn't run as the previous call is already queued
 */
export function createAnimQueued<T extends WrappedFn<NoReturnVal>>(fn: T) {
  let queued: boolean
  return (...args: Parameters<T>): NoReturnVal => {
    if (queued !== true) {
      queued = true
      requestAnimationFrame(async () => {
        await fn(...args as any)
        queued = false
      })
    }
  }
}

/** Helper function for creating event listeners. */
export function evtlistener(target: typeof window | typeof document | Element, events: string[], fn: AnyFn, opts: AddEventListenerOptions = {}) {
  events.forEach(event => {
    target.addEventListener(event, fn, opts)
  })
}

/** Helper function for removing event listeners. */
export function rmEvtlistener(target: typeof window | typeof document | Element, events: string[], fn: AnyFn, opts: AddEventListenerOptions = {}) {
  events.forEach(event => {
    target.removeEventListener(event, fn, opts)
  })
}

// ---------------
//  MEDIA QUERIES

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
// Init. our `curSize` variable.
updateSize()

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