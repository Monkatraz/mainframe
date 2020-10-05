// Functions (that are used as parameters) typing
type NoReturnVal = void | undefined
type WrappedFn<T> = (...args: any) => T
type WrappedPromiseFn<T> = (...args: any) => Promise<T>
type PromiseResolveFn<T = void> = (value?: any | PromiseLike<T> | undefined) => void
type PromiseRejectFn = (reason?: any) => void