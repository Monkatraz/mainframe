// Imports
import { ENV } from '@modules/util'
// FaunaDB
import FaunaDB, { values as FDBVals, query as q } from 'faunadb'

/** FaunaDB FQL extension. */
const qe = {

  /** Retrieves the `data` field of a document, using its reference. */
  Data(ref: FaunaDB.Expr) {
    return q.Select('data', q.Get(ref))
  },

  /** Reduces a keyvalue pair (`[id:any, data:any]`) to its key (`id`). */
  KeyValueToKey(keyvalue: FaunaDB.Expr) {
    return q.Select(0, keyvalue)
  },

  /** Returns the fields of the specified document. */
  Fields(obj: FaunaDB.Expr) {
    const _getFields = q.Map(q.ToArray(obj), q.Lambda(((keyvalue) => qe.KeyValueToKey(keyvalue))))
    return q.If(q.IsObject(obj), _getFields, q.Abort('Expression was not an object!'))
  },

  /** "Searches" and returns matches using the specified index.
   * 
   *  Shorthand for `q.Match(q.Index(index))`.
   */
  Search(index: FaunaDB.Expr | string, terms?: string | string[]): FaunaDB.Expr {
    // Use simple index string if specified
    const qindex = typeof index === 'string' ? q.Index(index) : index
    // Use terms if provided
    if (terms) return q.Match(qindex, terms)
    return q.Match(qindex)
  }
}

// Database Objects

type FDBObject = { [Key in string]?: FDBValue }
type FDBArray = Array<FDBValue>
type FDBValue = string | number | boolean | FDBObject | FDBArray | null |
  FDBVals.FaunaDate | FDBVals.FaunaTime | FDBVals.Bytes |
  FDBVals.Document | FDBVals.Ref

class Ref {
  constructor(
    public collection: string = '',
    public id: string = ''
  ) { }

  /**
   * Transforms an already retrieved FaunaDB Ref to a local Ref object.
   * @param faunaRef FaunaDB Ref object to create the local Ref object from.
   */
  static createFrom(faunaRef: FDBVals.Ref): Ref {
    const collection = faunaRef?.collection?.id ?? ''
    return new Ref(collection, faunaRef.id)
  }

  /** Returns an FQL expression that will return this Ref if used within an FQL query. */
  public get qRef() {
    return q.Ref(q.Collection(this.collection), this.id)
  }

  /** Returns the document associated with this reference.
   *  Uses the anonymous (limited permissions) `Clients.Reader` client by default.
   */
  public get(client: Client = Clients.Reader) {
    return client.query(q.Get(this.qRef))
  }

}

/** Response object from `Client.queryLazy`. Contains both Promisables and FQL expression fields.
 *
 *  Types: `field: Promise<any>`, `_qfield: FaunaDB.Expr`
 *  @example field = await QueryLazyResponse.field // Type 1
 *  @example _qfield === q.Select(field, obj_query) // Type 2
 */
type IQueryLazyResponse = {
  [field: string]: Promisable<FDBValue> | FaunaDB.Expr
}

class QueryResponse<B extends boolean, R = Data> {
  constructor(public ok: B, public body: B extends true ? R : Error) { }
}

function createQuery<R>(query: Promise<R>) {
  return query.then((body: R) => new QueryResponse(true, body))
    .catch((err: Error) => new QueryResponse(false, err))
}

class Client {
  private client!: FaunaDB.Client
  constructor(key: string) {
    if (key === '')
      return
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
  public query<T extends FDBValue = FDBValue>(expr: FaunaDB.Expr) {
    // TODO: Consider creating a query throttling system so that it would be possible to absolutely spam queries
    return createQuery<T>(new Promise((resolve, reject) => {
      this.client.query(expr)
        .then((result) => { resolve(result as T) })
        .catch((err: FaunaDB.errors.FaunaError) => {
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
  public paginate(expr: FaunaDB.Expr, params?: PlainObject, options?: FaunaDB.QueryOptions): FaunaDB.PageHelper {
    return this.client.paginate(expr)
  }

  /**
   * Returns a 'promisified' transformation of a FaunaDB document response.
   * Getting a property of this object for the first time will return a promise.
   * This promise will resolve to the desired field's value once the background query is complete.
   * Document properties will only download once. Values are cached and returned synchronously.
   * Additionally, for every field a `_qfield` variant is created, which returns an FQL expression for that field.
   * @example 
   * const lazyDoc = await Clients.Reader.queryLazy(q.Data(q.Search('pages_by_path', 'scp/3685')))
   * let val = await lazyDoc.cooldata // Takes some time due to inital database query
   * let val2 = await lazyDoc.cooldata // Returns from cache synchronously
   */
  public async queryLazy(obj: FaunaDB.Expr) {
    const response = await this.query<string[]>(qe.Fields(obj))
    // Return the err object if it failed
    if (!response.ok) return response

    // Object that will be returned
    const body: IQueryLazyResponse = {}
    // Factory for promise getter function thingy
    const _createGetter = (field: string) => {
      /** Queries the FaunaDB database for this field of the document or returns an already retrieved response.
       *  Errors must be caught manually - these getters do not return a `queryResult` object.
       */
      return () => {
        return new Promise((resolve) => {
          // Query database for document
          this.query(q.Select(field, obj)).then((result) => {
            if (result.ok === false) throw new Error('Error reading lazy field of document.')
            // Memoize/cache the function and return the query response body
            Object.defineProperty(body, field, { value: result.body })
            resolve(result.body)
          })
        })
      }
    }

    // For each field create a query promise for it
    // We also create a `_q[field]` sibling, which has the relevant FQL expression as its value
    const fields = response.body
    fields.forEach((field) => {
      // Getter
      Object.defineProperty(body, field, { get: _createGetter(field) })
      // FQL Expression
      Object.defineProperty(body, '_q' + field, { value: q.Select(field, obj) })
    })

    return new QueryResponse(true, body)
  }

  /** List of useful pre-assembled database functions. */
  get = {
    /** Returns a Ref object derived from the specified Page path. */
    pageRef: async (path: string) => {
      // TODO: use `q.Select('ref', q.Get(...))` instead
      const response = await this.query<FDBVals.Document<any>>(
        q.Paginate(
          q.Match(q.Index('pages_by_path'), path)
        )
      )
      // Return the err object if it failed
      if (!response.ok) return response

      const ref: FDBVals.Ref = response.body.data[0][0]
      return new QueryResponse(true, Ref.createFrom(ref))
    }
  };
}

// Init Clients
const Clients = {
  Reader: new Client(ENV.API.FDB_CLIENT_READER)
}


// Remote API Calls
// TODO: Netlify API module
// fetch(ENV.API.LAMBDA + 'hello').then(result => console.log(result))
