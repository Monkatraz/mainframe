// Fixing missing manual type on PrismJS
import '@types/prismjs'
import type * as typefest from 'type-fest'
declare module '@types/prismjs' {
  let manual: boolean
}

declare global {
  // Functions (that are used as parameters) typing
  type NoReturnVal = void | undefined
  type AnyFn<T = void> = (...args: any) => T
  type WrappedFn<T> = (...args: any) => T
  type WrappedPromiseFn<T> = (...args: any) => Promise<T>
  type PromiseResolveFn<T = void> = (value?: any | PromiseLike<T> | undefined) => void
  type PromiseRejectFn = (reason?: any) => void

  // Semantic Sorta Primitives
  /** _Strictly_ represents `{ 'key': value }` object.  */
  interface PlainObject {
    [x: string]: Data | object
  }

  /** Any without the fuss. Represents nearly all data objects. Doesn't include undefined or null. */
  type Data = string | number | bigint | boolean | symbol | PlainObject | Array<Data>

  /** Create a type that represents either the value or the value wrapped in `PromiseLike`. */
  type Promisable<T> = typefest.Promisable<T>

  type JSONObject = typefest.JsonObject
  type JSONArray = typefest.JsonArray
  type JSONValue = typefest.JsonValue

  // Fixes import.meta.env for Snowpack
  interface ImportMeta {
    env: {
      [index: string]: string
    }
  }
}