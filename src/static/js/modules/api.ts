/**
 * @file Exports the API for Mainframe. Interfaces with Netlify Functions and FaunaDB.
 * @author Monkatraz
 */

// FaunaDB
import FaunaDB, { Expr, values as v, errors as e } from 'faunadb'
// FDB types bug requires that I get a separate non-imported obj for the actual errors
const FDBErrors = FaunaDB.errors
export const q = FaunaDB.query
// Imports
import { ENV, Task, Result } from '@modules/util'

// -----------
// NETLIFY
// -----------

/** Invokes the Netlify Function specified by the `fn` parameter.
 *  As it returns a `Result`, use `Result.ok` to determine if the invokation succeeded or failed.
 */
export async function invokeLambda(fn: string, payload?: any, init?: RequestInit) {
  const url = ENV.API.LAMBDA + fn
  const method = payload ? 'POST' : 'GET'
  const forcedInit: RequestInit = {
    method: method,
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  // Construct init object
  let finalInit = init ? init : {}
  finalInit = Object.assign(finalInit, forcedInit)
  // Add `body` field if we have a payload
  if (method === 'POST') finalInit = Object.assign(finalInit, { body: JSON.stringify(payload) })

  // Execute invokation
  const fetchTask = await Task(fetch(url, finalInit))
  // Check if the `fetch` function itself errored
  if (!fetchTask.ok) return fetchTask
  const response = fetchTask.body
  // Return the response itself
  return new Result(response.ok, await response.json() as JSONObject)
}

// -----------
// FAUNADB
// -----------

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

// Simple error handler thingy
type ErrorHandlers = {
  [errorName: string]: () => void
  default: () => void
}
export type errorHandler = (error: Error | number | string) => void
/** Returns an `errorHandler` function, for matching error names to functions. */
export function newErrorHandler(errors: ErrorHandlers): errorHandler {
  return (err: Error | number | string) => {
    if (typeof err === 'number') err = err.toString()
    if (err instanceof Error) err = err.name
    // Execute matched error function if it exists
    if (typeof errors[err] === 'function') { return errors[err]() }
    // Otherwise, execute the default handler
    return errors.default()
  }
}

export function getStatusCode(err: Error) {
  if (err instanceof FDBErrors.FaunaHTTPError) {
    const code = err.requestResult.statusCode
    if (code !== 400) return code
    // Check if we're using `q.Abort()` and returned a 3 digit code
    if ((err as any).description.length === 3) {
      const int = parseInt((err as any).description)
      if (int) return int
    }
  }
  // Return 400 for unknown
  return 400
}

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
  },

  /** Shorthand function for getting a reference to a `Page` object, using a path as the search term. */
  PageFind(path: string) {
    return qe.Search('pages_by_path', path)
  },

  /** Shorthand function for retrieving a `Page` object, using a path as the search term. */
  PageData(path: string) {
    return qe.Data(qe.PageFind(path))
  }
}

/** Response object from `Client.queryLazy`. Contains both Promisables and FQL expression fields.
 *
 *  Types: `field: Promisable<FDBValue>`, `_qfield: Expr`
 *  @example field = await LazyDocument.field // Type 1
 *  @example _qfield === q.Select(field, obj_query) // Type 2
 */
class LazyDocument<T> {
  // Database values
  private _requestExpr: Expr
  private _client: Client
  public _fields: string[] = []
  constructor (requestExpr: Expr, client: Client = Clients.Public) {
    this._requestExpr = requestExpr
    this._client = client
  }

  private _setField(field: string, val: any) {
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
  public async _getLazy<K extends string & keyof T>(field: K): Promise<Lazyify<T[K]> & LazyDocument<T[K]>> {
    const lazydoc = await new LazyDocument<T[K]>(q.Select(field, this._requestExpr), this._client)._start()
    this._setField(field, lazydoc)
    return lazydoc as Lazyify<T[K]> & typeof lazydoc
  }

  public async _query<T = DataValue>(fn: (curRequestExpr: Expr) => Expr) {
    const response = await this._client.query<T>(fn(this._requestExpr))
    if (response.ok === false) throw new Error('Error retrieving field.')
    return response.body
  }

  public async _getFields(field: string) {
    const response = await this._client.query<string[]>(qe.Fields(q.Select(field, this._requestExpr)))
    if (response.ok === false) throw new Error('Error retrieving document.')
    return response.body
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
      scheme: 'https'
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
          console.warn(err)
          reject(err)
        })
    }))
  }

  // TODO: document
  public queryLazy<T = PlainObject>(expr: Expr) {
    return Task<Lazyify<T> & LazyDocument<T>>(new Promise((resolve, reject) => {
      new LazyDocument<T>(expr, this)._start().then((result) => { resolve(result as Lazyify<T> & LazyDocument<T>) })
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

// -----------
// USER
// -----------

export const User = {
  username: 'Guest',
  // FaunaDB User Auth
  auth: {
    // The amount of sensitive data here should be minimized as much as possible
    ref: '',
    token: ''
  },
  // LocalStorage preferences
  preferences: {
    langs: ['en']
  }
  // TODO: Functions
}

// -----------
// SOCIAL
// -----------


export interface Social {
  /** A reference to the user's actual User document.
   *  This document cannot actually be read - but this reference serves as the canonical ID for this user.
   *  Additionally, the actual ID of the `Ref` (not the collection) serves as the URL path for the user. */
  user: Ref
  /** A page (actually a `Subpage` object) specific to the user. Only they can edit it. */
  authorpage: Subpage
  /** The nickname for this user. They can change it at any time. */
  nickname: string
  /** A very short description for the user.
   *  It is intended for info like pronouns, as it is always displayed with the user. Optional. */
  tagline: string
  /** A more formal, and longer, description for the user. Optional. */
  bio: string
}

// -----------
// PAGES
// -----------

// Types
/** Tuple representing a user rating on a page. */
type Rating = [Ref, 1 | -1 | 0]
/** A list of page tags. */
type Tags = string[]
/** A list of page flags. */
type Flags = string[]

/** `Comment` objects represent single comments stored within a `Page` object. */
export interface Comment {
  /** Reference to the author of the comment. */
  author: Ref
  /** Language of the comment - chooses the preferred language first, but can be changed. */
  language: string
  /** General metadata, like current revision and creation date. */
  meta: {
    /** Number of revisions (edits) for this comment Starts at 1. */
    revision: number
    /** Date when this comment was created. Use `.date()` method to convert to a JS `Date`. */
    dateCreated: FaunaDate
    /** Date when this comment was last edited. Use `.date()` method to convert to a JS `Date`. */
    dateLastEdited: FaunaDate
  }
  /** Whether or not the comment has been pinned. */
  pinned: boolean
  /** May be null, or contain a reference to another Comment that this particular comment is replying to. */
  replyingto: Ref | null
  /** Content of the comment. */
  content: Subpage
}

// Page Interface

// Valid template languages
enum TemplateLangs {
  Pug = 'pug'
}

// TODO: Rename to be generalized to any html + pug content
/** `Subpage`s represent the set of objects that actually contain a `Page`'s consumable content. */
export interface Subpage {
  /** Rendered form of the content. */
  html: string
  /** Render flags for the content. */
  flags: Flags
  /** String value representing what templating language the source of the content is in. */
  templatelang: TemplateLangs
  /** The source template of the content. */
  template: string
}

// TODO: 'type' property types (PageTypeSCP ?)
/** `View` objects represent a particular language variant of a page. */
export interface View {
  /** The specific language this view is relevant for. */
  language: string
  /** Users who translated this particular version. Can be empty. */
  translators: Ref[]
  /** Localized description of the page. */
  desc: {
    type: [id: string, meta: {}]
    title: string
    subtitle: string
    description: string
  }
  /** Page that loads first (default URL). */
  root: Subpage
  /** List of subpages. Field name / key determines the subpath.
   *  E.g: `articles/mainpath/subpage1`
   */
  subpages: {
    [path: string]: Subpage
  }
}

/** Root level object retrieved from the FaunaDB database. Contains everything relevant to a `Page`. */
export interface Page {
  /** URL path, starting from root. Is always unique. */
  path: string
  /** Version number, used for backwards compatibility handling (if needed) */
  version: number
  /** Metadata - contains things like `Authors`, the current `revision`, etc. */
  meta: {
    // TODO: user object
    /** Set of users who authored this page and have edit permissions. */
    authors: Ref[]
    /** Number of revisions (edits) for this page. Starts at 1. */
    revision: number
    /** Date when this page was created. */
    dateCreated: Date
    /** Date when this page was last edited. */
    dateLastEdited: Date
    /** A list of strings containing meta-contextual labels for a page.
     *  E.g. a flag like 'cc_validated' could be present within this list.
     */
    flags: Flags[]
    /** List of strings describing the contents of the article. */
    tags: Tags[]
  }
  social: {
    /** A list of `Rating` objects representing how users have voted on this page. */
    ratings: Rating[]
    /** A list of 'Comment' objects, storing how users commented on this page. */
    comments: string[]
  }
  /** Dictionary-like object (e.g `en: {}`) listing all versions of this page.
   *  Fields denote which language the `View` is for.
   */
  locals: {
    [lang: string]: View
  }
}

export class PageHandler {
  public lang!: string
  public targetReady: Promise<boolean>
  public targetValue!: DataValue
  public dataReady: Promise<boolean>
  public data!: Lazyify<Page> & LazyDocument<Page>
  constructor (public path = '', public target = 'html') {
    this.targetReady = (async () => {
      const response = await this.init()
      if (response.ok) {
        this.targetValue = response.body[0]
        this.lang = response.body[1]
      } else {
        throw response.body
      }
      return true
    })()
    this.dataReady = (async () => {
      // TODO: handle exceptions here
      const response = await Clients.Public.queryLazy<Page>(qe.PageData(this.path))
      if (response.ok) this.data = response.body
      return true
    })()
  }

  private createLangExprBinding(expr: Expr | Expr[]) {
    return q.Let(
      {
        'path': qe.Search('pages_by_path', this.path),
        'data': qe.Data(q.Var('path')),
        'langs': qe.Fields(q.Select('locals', q.Var('data'))),
        'intersect': q.Intersection(User.preferences.langs, q.Var('langs')),
        'lang': q.If(
          q.Not(q.IsEmpty(q.Var('intersect'))),
          q.Select(0, q.Var('intersect')),
          q.Select(0, q.Var('langs'))
        )
      },
      expr
    )
  }

  private async init() {
    // The processing of the page like this on FaunaDB's end massively improves latency
    // The basic gist is:
    //  1. Check if the page path exists, if not, abort with boolean false
    //  2. Create a bunch of variables that build off each other
    //    - These variables ultimately conclude with 'lang'
    //    - 'lang' is a string that denotes which field in the `Page`'s `locals` field we need to use
    //    - It compares against the users preferred languages and picks the first one
    //    - If none of the languages available match the users, it just uses the first one in `locals`
    //  3. Dig through the object and select whatever `target` we want (e.g. 'html')
    //  4. Put the target expression and the determined language in a tuple/array
    //  5. Tada
    // This is a single request - which literally saves seconds.
    // If it was not done this way, the client would have to process this info and that would take forever

    //  Create our target expression
    let targetExpr: Expr = {}
    switch (this.target) {
      case 'html': {
        targetExpr = q.Select('html', q.Select('root', q.Select(q.Var('lang'), q.Select('locals', q.Var('data')))))
      }
    }
    // Create our executor expression
    const expr = q.If(
      q.Exists(qe.Search('pages_by_path', this.path)),
      this.createLangExprBinding([targetExpr, q.Var('lang')]),
      q.Abort('404')
    )
    // Execute and check if it failed
    const response = await Clients.Public.query<[DataValue, string]>(expr)
    if (!response.ok) return new Result(false, response.body)

    return new Result(true, response.body)
  }
}

addEventListener('DOMContentLoaded', () => {
  const pageTemplate: Page = {
    path: 'scp/3685',
    version: 1,
    meta: {
      authors: [],
      revision: 1,
      dateCreated: new Date,
      dateLastEdited: new Date,
      flags: [],
      tags: []
    },
    social: {
      ratings: [],
      comments: []
    },
    locals: {
      'en': {
        language: 'en',
        translators: [],
        desc: {
          type: ['scp', {}],
          title: 'SCP-3685',
          subtitle: 'The Fractured Pile',
          description: ''
        },
        root: {
          html: '',
          flags: [],
          templatelang: TemplateLangs.Pug,
          template: ''
        },
        subpages: {}
      }
    }
  }

  // invokeLambda('page-update', pageTemplate).then(console.log)
})