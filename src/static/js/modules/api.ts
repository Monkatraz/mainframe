/**
 * @file API for interfacing with Netlify and/or FaunaDB.
 * @author Monkatraz
 */

// FaunaDB
import FaunaDB, { Expr } from 'faunadb'
const q = FaunaDB.query
// Imports
import { ENV } from '@modules/util'
import { qe, DataObject, DataValue, QueryException } from './api-fdb'

// TODO: Document these
class QueryResponse<B extends boolean, R = Data> {
  constructor (public ok: B, public body: B extends true ? R : Error) { }
}

function createQuery<R>(query: Promise<R>) {
  return query.then((body: R) => new QueryResponse(true, body))
    .catch((err: Error) => new QueryResponse(false, err))
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
  constructor (requestExpr: Expr, client: Client = Clients.Reader) {
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
   * To use, check the `queryResult.ok` boolean first. If true, the query was successful.
   * The result of the query will be found in the `queryResult.body` object.
   * Provide a type parameter to this function so that TS explictly knows the response body type.
   * @example Clients.Reader.query(...).then(result => { result.ok ? foo(result.body) : ohno() }
   */
  public query<T extends DataValue = DataValue>(expr: Expr) {
    return createQuery<T>(new Promise((resolve, reject) => {
      this.client.query(expr)
        .then((result) => { resolve(result as T) })
        .catch((err: QueryException) => {
          // TODO: Error handling (basic Permission denied, bad request, etc.)
          console.error('FaunaDB error caught - treating as non-fatal')
          console.warn(err)
          reject(err)
        })
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

// Init Clients
const Clients = {
  Reader: new Client(ENV.API.FDB_CLIENT_READER)
}

async function test() {
  const lazydoc = await new LazyDocument(qe.Data(qe.Search('pages_by_path', 'scp/3685')))._start()
  console.log(lazydoc)
  console.log(await lazydoc._getLazy('obj'))
}

test()


// Remote API Calls
// TODO: Netlify API module
// fetch(ENV.API.LAMBDA + 'hello').then(result => console.log(result))
