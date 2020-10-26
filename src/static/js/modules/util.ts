/**
 * @file Utility functions and objects.
 * @author Monkatraz
 */
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
    if (!timeout) {
      timeout = setTimeout(next, limitMS)
    }
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
  if (typeof asyncTimerFn !== 'function') {
    asyncTimerFn = () => sleep(100)
  }
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
    waitFor(() => locked === false)
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
      requestAnimationFrame(() => {
        fn(...args as any)
        queued = false
      })
    }
  }
}

/** Contains all environment variables. */
export const ENV = {
  /** API related env. variables. Usually database related. */
  API: {
    // Database
    FDB_PUBLIC: import.meta.env.SNOWPACK_PUBLIC_API_FDB_PUBLIC,
    FDB_DOMAIN: import.meta.env.SNOWPACK_PUBLIC_API_FDB_DOMAIN,
    // Serverless functions
    LAMBDA: import.meta.env.SNOWPACK_PUBLIC_API_LAMBDA
  },
  HOMEPAGE: import.meta.env.SNOWPACK_PUBLIC_HOMEPAGE
}

/** Functional-ish Result class object. It's not quite how Result tends to work - but that's fine here.
 *  You can check the `Result.ok` field to determine if the operation was successful or not. 
 *  If it wasn't, the `Result.body` field will contain the Error object. */
export class Result<B extends boolean, R = Data> {
  constructor (public ok: B, public body: B extends true ? R : Error) { }
}

/** Creates a Task like object that returns a `Result` object from a Promise. */
export function Task<R>(promise: Promise<R>) {
  return promise.then((body: R) => new Result(true, body))
    .catch((err: Error) => new Result(false, err))
}

const APPENDSCRIPT_TIMEOUT_INTERVAL = 10000
/** Async. loads scripts from relative path / URL.
 *  Promise resolves once the script has fully loaded.
 *  If it takes too long to download the script, the promise will reject.
 */
export function appendScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(reject, APPENDSCRIPT_TIMEOUT_INTERVAL)
    const _resolve = () => { clearTimeout(timeout); resolve() }

    const script = document.createElement('script')
    script.src = src
    script.onload = _resolve
    document.head.appendChild(script)
  })
}

const APPENDSTYLESHEET_TIMEOUT_INTERVAL = 10000
/** Async. loads stylesheets from relative path / URL.
 *  Promise resolves once the stylesheet has fully loaded.
 *  If it takes too long to download the stylesheet, the promise will reject.
 */
export function appendStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(reject, APPENDSTYLESHEET_TIMEOUT_INTERVAL)
    const _resolve = () => { clearTimeout(timeout); resolve() }

    const stylesheet = document.createElement('link')
    stylesheet.rel = 'stylesheet'
    stylesheet.href = href
    stylesheet.onload = _resolve
    document.head.appendChild(stylesheet)
  })
}