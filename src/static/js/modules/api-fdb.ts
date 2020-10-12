/**
 * @file FaunaDB API. Primary export is the `Clients` object.
 * @author Monkatraz
 */

// FaunaDB
import FaunaDB, { Expr, values as v, errors as e } from 'faunadb'
const q = FaunaDB.query
// Imports
import { ENV, Task } from '@modules/util'

// Values
/** Database variant of the JS `Date` class. Use the `date()` method to convert a `FaunaDate` into a JS `Date`.
 *  @example
 * q.Date('1970-01-01')
 */
export type FaunaDate = v.FaunaDate
/** FaunaDB internal timestamp (aka `ts`) object. Usually used for data history. Use the `date()` method to get a `Date` class version of a FaunaDB `Timestamp`.
 * @example
 * q.Time('1970-01-01T00:00:00Z')
 */
export type Timestamp = v.FaunaTime
/** Denotes a Base64-encoded string representing a byte array. */
export type Bytes = v.Bytes
/** Denotes a resource reference. Can be used to retrieve documents. */
export type Ref = v.Ref
/** Represents any valid FaunaDB data type. */
export type DataValue = string | number | boolean | null | DataObject | DataArray | FaunaDate | Timestamp | Bytes | Ref
/** Represents any FaunaDB data Object. */
export type DataObject = { [Key in string]?: DataValue }
/** Represents any FaunaDB data Array or Set. */
export type DataArray = Array<DataValue>
/** FaunaDB document, as retrieved from a reference (`Ref`). */
export type Document = v.Document

// Errors
/** Covers any FaunaDB error. */
export type QueryException = e.FaunaError
/** Error thrown when an invalid query is given. */
export type QueryInvalidValue = e.InvalidValue
/** Covers any error that occurs at the FaunaDB endpoint. */
export type QueryError = e.FaunaHTTPError
/** HTTP 400 error. */
export type QueryBadRequest = e.BadRequest
/** HTTP 401 error. */
export type QueryUnauthorized = e.Unauthorized
/** HTTP 403 error. */
export type QueryPermissionDenied = e.PermissionDenied
/** HTTP 404 error. */
export type QueryNotFound = e.NotFound
/** HTTP 405 error. */
export type QueryMethodNotAllowed = e.MethodNotAllowed
/** HTTP 500 error. */
export type QueryInternalError = e.InternalError
/** HTTP 503 error. */
export type QueryUnavailable = e.UnavailableError

/** Error thrown when a given query input was invalid. */
export type QueryInputError = QueryBadRequest | QueryInvalidValue
/** Error thrown when a given query input lacked the permissions needed to execute it. */
export type QueryPermissionError = QueryUnauthorized | QueryMethodNotAllowed | QueryPermissionDenied
/** Error thrown by FaunaDB when the endpoint had some sort of query agnostic error. */
export type QueryEndpointError = QueryInternalError | QueryUnavailable

/** FaunaDB JS FQL driver extension. 
 *  All functions within map to valid FaunaDB JS driver functions.
 *  AKA these functions do not map to database-side UDF functions.
*/
export const qe = {

  /** Retrieves the `data` field of a document, using its reference. */
  Data(ref: Expr) {
    return q.Select('data', q.Get(ref))
  },

  /** `if: then, elseif: then, finally: exhausted` mapping.
   *  @example 
   * qe.IfMap(q.Abort('Object is not an object or array!'), [
   * [q.isObject(SomeObj), q.Select('yes', SomeObj)],
   * [q.isArray(SomeObj), q.Select(0, SomeObj)]
   * ])
   */
  IfMap(exhausted: Expr, conditionals: [condition: Expr, then: Expr][]) {
    // Work from the deepest node to the highest node
    const reducer = (acc: Expr, conditional: [condition: Expr, then: Expr]) =>
      q.If(conditional[0], conditional[1], acc)
    return conditionals.reverse().reduce(reducer, exhausted)
  },

  /** Returns the fields of the specified array/objcet.. */
  Fields(obj: Expr) {
    // Reduces `[id, value]` pair to just `id`
    const lambda = q.Lambda(((keyvalue) => q.Select(0, keyvalue)))
    return qe.IfMap(q.Abort('Invalid object provided to Fields query!'), [
      [q.IsObject(obj), q.Map(q.ToArray(obj), lambda)],
      [q.IsArray(obj), obj]
    ])
  },

  /** "Searches" and returns matches using the specified index.
   * 
   *  Shorthand for `q.Match(q.Index(index))`.
   */
  Search(index: Expr | string, terms?: string | string[]) {
    // Use simple index string if specified
    const qindex = typeof index === 'string' ? q.Index(index) : index
    // Use terms if provided
    if (terms) return q.Match(qindex, terms)
    return q.Match(qindex)
  }
}

/** Response object from `Client.queryLazy`. Contains both Promisables and FQL expression fields.
 *
 *  Types: `field: Promisable<FDBValue>`, `_qfield: Expr`
 *  @example field = await LazyDocument.field // Type 1
 *  @example _qfield === q.Select(field, obj_query) // Type 2
 */
class LazyDocument {
  [field: string]: Promisable<any>
  // Database values
  private _requestExpr: Expr
  private _client: Client
  private _fields: string[] = []
  constructor (requestExpr: Expr, client: Client = Clients.Public) {
    this._requestExpr = requestExpr
    this._client = client
  }

  private _setField(field: string, val: AnyFn | DataValue) {
    const opts: PlainObject = { configurable: true, enumerable: true }
    if (typeof val === 'function') opts['get'] = val
    if (typeof val !== 'function') opts['value'] = val
    Object.defineProperty(this, field, opts)
  }

  /** Queries the FaunaDB database for this field of the document or returns an already retrieved response.
   *  Errors must be caught manually - these getters do not return a `QueryResponse` object.
   */
  private _getter(field: string) {
    return new Promise((resolve) => {
      this._client.query(q.Select(field, this._requestExpr)).then((response) => {
        if (response.ok === false) throw new Error('Error reading lazy field of document.')
        // Memoize/cache the function and return the query response body
        this._setField(field, response.body)
        resolve(response.body)
      })
    })
  }

  public async _start() {
    // Check if the FQL expr returns an object
    const isObjResponse = await this._client.query(q.IsObject(this._requestExpr))
    if (isObjResponse.ok === false) throw new Error('Error retrieving document.')
    if (isObjResponse.body === false) throw new Error('Invalid FaunaDB object.')

    // Get fields of requested document
    const response = await this._client.query<string[]>(qe.Fields(this._requestExpr))
    if (response.ok === false) throw new Error('Error retrieving document.')
    this._fields = response.body

    // Set field promise getters for each field
    response.body.forEach((field) => {
      this._setField(field, () => this._getter(field))
    })
    return this
  }

  /** Eagerly loads the rest of the `LazyDocument`. */
  public async _eagerLoad() {
    // Just plain get the whole object
    const response = await this._client.query<DataObject>(this._requestExpr)
    if (response.ok === false) throw new Error('Error retrieving document.')
    // Set every field to its actual value
    this._fields.forEach((field) => {
      this._setField(field, response.body[field] as DataValue)
    })
    return this
  }

  /** Returns the requested field as another `LazyDocument`.
   *  The requested field _must_ be an object for this to work. `LazyDocument` requires key-value pairs. */
  public async _getLazy(field: string) {
    const lazydoc = await new LazyDocument(q.Select(field, this._requestExpr), this._client)._start()
    this._setField(field, lazydoc)
    return lazydoc
  }
}

class Client {
  private client!: FaunaDB.Client
  constructor (key: string) {
    if (key === '') return
    // The types for FaunaDB clients is slightly outdated.
    // queryTimeout _does_ exist on the Client options object, but not in the type.
    this.client = new FaunaDB.Client({
      secret: key,
      domain: ENV.API.FDB_DOMAIN,
      scheme: 'https',
      timeout: 2000,
      queryTimeout: 1000
    } as any)
  }

  /**
   * Wrapper for `FaunaDB.Client.query()`. Includes safe error handling.
   * To use, check the `Result.ok` boolean first. If true, the query was successful.
   * The result of the query will be found in the `Result.body` object.
   * Provide a type parameter to this function so that TS explictly knows the response body type.
   * @example Clients.Reader.query(...).then(result => { result.ok ? foo(result.body) : ohno() }
   */
  public query<T = DataValue>(expr: Expr) {
    return Task<T>(new Promise((resolve, reject) => {
      this.client.query(expr)
        .then((result) => { resolve(result as unknown as T) })
        .catch((err: QueryException) => {
          // TODO: Error handling (basic Permission denied, bad request, etc.)
          console.error('FaunaDB error caught - treating as non-fatal')
          console.warn(err)
          reject(err)
        })
    }))
  }

  // TODO: document
  public queryLazy<T = LazyObject>(expr: Expr) {
    return Task<T & LazyDocument>(new Promise((resolve, reject) => {
      new LazyDocument(expr, this)._start().then((result) => { resolve(result as T & LazyDocument) })
        .catch(reject)
    }))
  }

  // TODO: Better wrapper for paginate
  /**
   * Wrapper for `FaunaDB.Client.paginate()` Use as normal - meaning errors must be caught manually.
   */
  public paginate(expr: Expr, params?: PlainObject, options?: FaunaDB.QueryOptions): FaunaDB.PageHelper {
    return this.client.paginate(expr)
  }
}

interface FaunaClients {
  /** Reader client for simply reading pages. Always available, uses a public key. */
  Public: Client
  /** Client created upon a successful login attempt. */
  User: Client | null
  /** Short-lived admin client created upon a successful admin authorization action. (sudo-mode) */
  Admin: Client | null
}

// Init Clients
export const Clients: FaunaClients = {
  Public: new Client(ENV.API.FDB_PUBLIC),
  User: null,
  Admin: null
}