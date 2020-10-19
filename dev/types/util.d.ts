/**
 * @file Misc. type declarations for the project.
 * @author Monkatraz
 */
// Fixing missing `manual` property on PrismJS
import '@types/prismjs'
declare module '@types/prismjs' {
  let manual: boolean
}
// Project-Wide Additions
declare global {
  // Function Types
  type NoReturnVal = void | undefined
  type AnyFn<T = void> = (...args: any) => T
  type WrappedFn<T> = (...args: any) => T
  type WrappedPromiseFn<T> = (...args: any) => Promise<T>
  type PromiseResolveFn<T = void> = (value?: any | PromiseLike<T> | undefined) => void
  type PromiseRejectFn = (reason?: any) => void

  /** Represents an object whose fields are all functions that return promises. */
  type Lazyify<T> = {
    [P in keyof T]: {
      (): Promisable<T>
    }
  }

  // Semantic Sorta Primitives
  /** All JS primitive values. */
  type Primitive = string | number | bigint | boolean | symbol | null | undefined
  /** _Strictly_ represents a `{ 'key': value }` object, including functions properties. */
  interface PlainObject {
    [x: string]: Primitive | object
  }
  interface LazyObject {
    [x: string]: Promiseable<Primitive | object>
  }
  /** Any without the fuss. Represents nearly all data objects. Doesn't include undefined or null. */
  type Data = string | number | bigint | boolean | symbol | DataObject | Array<Data>

  /** Create a type that represents either the value or the value wrapped in `PromiseLike`. */
  type Promisable<T> = T | PromiseLike<T>

  /** Matches a JSON object. */
  export type JSONObject = { [Key in string]?: JSONValue }

  /** Matches a JSON array. */
  type JSONArray = Array<JSONValue>

  /** Matches any valid JSON value. */
  export type JSONValue = string | number | boolean | null | JSONObject | JSONArray

  // Fixes import.meta.env for Snowpack
  interface ImportMeta {
    env: {
      [index: string]: string
    }
  }
}