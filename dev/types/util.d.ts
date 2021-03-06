/* eslint-disable @typescript-eslint/no-invalid-void-type */
/**
 * @file Misc. type declarations for the project.
 * @author Monkatraz
 */

// Project-Wide Additions
export declare global {
  // Function Types
  type NoReturnVal = void | undefined | Promise<void>
  type AnyFn<T = void> = (...args: any) => T
  type WrappedFn<T> = (...args: any) => T
  type WrappedPromiseFn<T> = (...args: any) => Promise<T>
  type PromiseResolveFn<T = void> = (value?: any | PromiseLike<T> | undefined) => void
  type PromiseRejectFn = (reason?: any) => void

  /** Represents an object whose fields are all functions that return promises. */
  type Lazyify<T> = {
    [P in keyof T]: Promisable<T[P]>
  }

  type Await<T> = T extends PromiseLike<infer U> ? U : T
  export type PromiseValue<PromiseType, Otherwise = PromiseType> = PromiseType extends Promise<infer Value>
    ? { 0: PromiseValue<Value>; 1: Value }[PromiseType extends Promise<unknown> ? 0 : 1]
    : Otherwise

  // Semantic Sorta Primitives
  /** All JS primitive values. */
  type Primitive = string | number | bigint | boolean | symbol | null | undefined
  /** _Strictly_ represents a `{ 'key': value }` object, including functions properties. */
  type PlainObject = Record<string, Primitive | Record<string, unknown>>
  type LazyObject = Record<string, Promiseable<Primitive | Record<string, unknown>>>
  /** Represents a generic `Class` constructor. */
  type Class<T = unknown, Arguments extends any[] = any[]> = new (...arguments_: Arguments) => T
  /** Any without the fuss. Represents nearly all data objects. Doesn't include undefined or null. */
  type Data = string | number | bigint | boolean | symbol | DataObject | Data[]

  /** Create a type that represents either the value or the value wrapped in `PromiseLike`. */
  type Promisable<T> = T | PromiseLike<T>

  /** Matches a JSON object. */
  type JSONObject = { [Key in string]?: JSONValue }

  /** Matches a JSON array. */
  type JSONArray = JSONValue[]

  /** Matches any valid JSON value. */
  type JSONValue = string | number | boolean | null | JSONObject | JSONArray

  type Point = [x: number, y: number]

  // Fixes import.meta.env for Snowpack
  interface ImportMeta {
    env: Record<string, string>
  }
}
