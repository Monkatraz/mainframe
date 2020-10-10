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
 * Deferreds are an extended variant of ordinary JavaScript promises.
 * Specifically, Deferreds have the normally private `resolve, reject` executor functions made public.
 * They can be retrieved through the `Deferred.resolve` and `Deferred.reject` properties.
 * @example 
 * const deferred = new Deferred()
 * deferred.resolve() // or .reject()
 */
export class Deferred<T = void> extends Promise<T> {
  /** Resolves the deferred promise. */
  public resolve!: (value?: T | PromiseLike<T> | undefined) => void
  /** Rejects the deferred promise. */
  public reject!: (reason?: any) => void
  /**
   * Creates a promise with exposed resolve and reject functions.
   * Specifically, Deferred.resolve() and Deferred.reject().
   * @param executor Optional argument - allows a function to be executed within the promise as usual.
   */
  constructor (executor?: (resolve: PromiseResolveFn, reject: PromiseRejectFn) => void) {
    super((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      if (executor) executor(resolve, reject)
    })
  }
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
    FDB_CLIENT_READER: import.meta.env.SNOWPACK_PUBLIC_API_FDB_CLIENT_READER,
    FDB_DOMAIN: import.meta.env.SNOWPACK_PUBLIC_API_FDB_DOMAIN,
    // Serverless functions
    LAMBDA: import.meta.env.SNOWPACK_PUBLIC_API_LAMBDA
  }
}

const LOADSCRIPT_TIMEOUT_INTERVAL = 10000
/** Async. loads scripts from relative path / URL.
 *  Promise resolves once the script has fully loaded.
 *  If it takes too long to download the script, the promise will reject.
 */
export function appendScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(reject, LOADSCRIPT_TIMEOUT_INTERVAL)
    const _resolve = () => { clearTimeout(timeout); resolve() }

    // Wait for the script container to load (just in case)
    waitFor(() => document.querySelector('#script-container') !== null)
      .then(() => {
        const script = document.createElement('script')
        script.src = src
        script.onload = _resolve
        // TypeScript doesn't realize that I've checked for null
        const container = document.querySelector('#script-container') as Element
        container.appendChild(script)
      })
  })
}