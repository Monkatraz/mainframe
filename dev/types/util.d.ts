// Functions (that are used as parameters) typing
declare global {
  type NoReturnVal = void | undefined
  type AnyFn<T = void> = (...args: any) => T
  type WrappedFn<T> = (...args: any) => T
  type WrappedPromiseFn<T> = (...args: any) => Promise<T>
  type PromiseResolveFn<T = void> = (value?: any | PromiseLike<T> | undefined) => void
  type PromiseRejectFn = (reason?: any) => void
}

// Fixing missing manual type on PrismJS
import Prism from '@types/prismjs'
declare module '@types/prismjs' {
  var manual: boolean
}