/**
 * @file Exports the API for Mainframe. Interfaces with FaunaDB and controls user state.
 * @author Monkatraz
 */

import FaunaDB, { Expr, errors as e, values as v } from 'faunadb'
const FDBErrors = FaunaDB.errors
export const q = FaunaDB.query
import type { Page, Social } from '@schemas'
import { Pref, ENV } from './state'
import { writable } from 'svelte/store'

// ---------
//  FAUNADB

// Values
/** Database variant of the JS `Date` class. Use the `date()` method to convert a `FaunaDate` into a JS `Date`.
 *  @example
 * q.Date('1970-01-01') */
export type FaunaDate = v.FaunaDate
/** FaunaDB internal timestamp (aka `ts`) object. Usually used for data history. Use the `date()` method to get a `Date` class version of a FaunaDB `Timestamp`.
 * @example
 * q.Time('1970-01-01T00:00:00Z') */
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
export type DataArray = DataValue[]
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

/** Gets the status code of any error, defaulting to 400.
 *  Has special handling for `FaunaHTTPError`s. */
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
 *  AKA these functions do not map to database-side UDF functions. */
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
   * ]) */
  IfMap(exhausted: Expr, conditionals: [condition: Expr, then: Expr][]) {
    // Work from the deepest node to the highest node
    const reducer = (acc: Expr, conditional: [condition: Expr, then: Expr]) => q.If(conditional[0], conditional[1], acc)
    return conditionals.reverse().reduce(reducer, exhausted)
  },

  /** Returns the fields of the specified array/object. */
  Fields(obj: Expr) {
    // Reduces `[id, value]` pair to just `id`
    const lambda = q.Lambda((keyvalue => q.Select(0, keyvalue)))
    return qe.IfMap(q.Abort('400'), [
      [q.IsObject(obj), q.Map(q.ToArray(obj), lambda)],
      [q.IsArray(obj), obj]
    ])
  },

  /** "Searches" and returns matches using the specified index.
   *
   *  Shorthand for `q.Match(q.Index(index))`. */
  Search(index: Expr | string, ...terms: Expr[]) {
    // Use simple index string if specified
    const qindex = typeof index === 'string' ? q.Index(index) : index
    // Use terms if provided
    if (terms) return q.Match(qindex, ...terms)
    return q.Match(qindex)
  },

  /** Shorthand function that returns the most-likely-to-be-correct-language for a user once given a page. */
  PageLang(obj: Expr) {
    return q.Let(
      {
        langs: qe.Fields(q.Select('locals', obj)),
        intersect: q.Intersection(User.preferences.langs, q.Var('langs')),
        lang: q.If(q.Not(q.IsEmpty(q.Var('intersect'))),
          q.Select(0, q.Var('intersect')),
          q.Select(0, q.Var('langs'))
        )
      },
      q.Var('lang')
    )
  },

  /** Filters an input FDB-side obj. using arrays of key names. */
  Filter(obj: Expr, filter: (string | [string, (string | Expr)[] | Expr])[]) {
    const filterObj: Record<string, Expr> = {}
    filter.forEach((key) => {
      // [key, Expr | []] format
      if (key instanceof Array) {
        if (key[1] instanceof Array) filterObj[key[0]] = q.Select(key[1], q.Var('fdobj'))
        else filterObj[key[0]] = key[1] // Don't select, just use the FDB Expr
      }
      // Key list format
      else filterObj[key] = q.Select(key, q.Var('fdobj'))
    })
    return q.Let({ fdobj: obj }, filterObj)
  }
}

class Client {
  private client!: FaunaDB.Client
  public query!: FaunaDB.Client['query']
  public paginate!: FaunaDB.Client['paginate']
  constructor(key: string) {
    if (key === '') return
    this.client = new FaunaDB.Client({
      secret: key,
      domain: ENV.API.FDB_DOMAIN,
      scheme: 'https'
    })
    this.query = this.client.query.bind(this.client)
    this.paginate = this.client.paginate.bind(this.client)
  }
  public invoke<T = DataValue>(fn: string, ...payload: any[]) {
    if (payload?.length) return this.query<T>(q.Call(q.Function(fn), ...payload))
    else return this.query<T>(q.Call(q.Function(fn)))
  }
}

interface TokenInstance {
  ref: Ref
  instance: Ref
  secret: string
}

interface LoginResult {
  user: TokenInstance
  session?: TokenInstance
}

type Session = { id: string, secret: string } | null

type ModeGuest = {
  authed: false
  client: Client
}

type ModeUser = {
  authed: true
  id: Ref
  social: Social
  client: Client
}

/** Store that allows for reactive checking of user authed state. */
export const authed = writable(false)

async function setUserMode(state: boolean, token?: TokenInstance) {
  // Assigns are used here for type wizardy shenanigans
  if (state && token) Object.assign(User, {
    authed: true,
    id: token.ref,
    social: await User.client.invoke<Social>('socials_of', token.instance),
    client: new Client(token.secret)
  })
  else Object.assign(User, {
    authed: false,
    id: undefined,
    social: undefined,
    client: new Client(ENV.API.FDB_PUBLIC)
  })
  authed.set(!!(state && token))
}

/** Represents the current user. */
export const User = {
  // type wizardy that allows for `User.authed` type narrowing without nested objects being needed
  ...{ authed: false, client: new Client(ENV.API.FDB_PUBLIC) } as (ModeUser | ModeGuest),

  preferences: {
    langs: ['en']
  },

  /** Creates an account registration event. Does not sign the guest in. */
  async guestRegister(email: string, password: string) {
    if (User.authed) throw new Error()
    await User.client.invoke<Ref>('auth_register', email, password)
  },

  /** Signs an unsigned guest in using the provided credentials. */
  async login(email: string, password: string, remember = false) {
    if (User.authed) throw new Error()
    const { user, session } = await User.client.invoke<LoginResult>('auth_login', email, password, remember)
    await setUserMode(true, user)
    if (remember && session) Pref.set('user-session', { id: session.instance.id, secret: session.secret })
  },

  /** Attempts to automatically log the user in.
   *  Returns whether or not this was successful. */
  async autologin() {
    if (User.authed) throw new Error()
    const session = Pref.get<Session>('user-session', null)
    if (!session) return false
    try {
      const user = await this.client.invoke<TokenInstance | null>('auth_login_auto', session.id, session.secret)
      if (!user) return false
      await setUserMode(true, user)
      return true
    } catch {
      return false
    }
  },

  /** Signs out a signed in user. */
  async logout() {
    if (!User.authed) throw new Error()
    const session = Pref.get<Session>('user-session', null)
    if (session) await User.client.invoke('auth_end_session', session.id, session.secret)
    await User.client.query(q.Logout(false))
    await setUserMode(false)
    Pref.set('user-session', '')
  }
}

export async function createPage(type: string, name: string, lang: string): Promise<Page.Instance> {
  if (!User.authed) throw new Error()
  const ref = await User.client.invoke<Ref>('create_page', type, name, lang)
  return await User.client.query<Page.Instance>(qe.Data(ref))
}

/** Smart Page API handler function. */
export function withPage(path: string, lang: string | Expr = qe.PageLang(q.Var('data'))) {
  const vars = { data: qe.Data(qe.Search('pages_by_path', path as Expr)), lang: lang }
  const local = q.Select(['locals', q.Var('lang')], q.Var('data'))
  const ql = (expr: Expr) => q.Let(vars, expr)
  return {

    /** Requests the entirety of the page. */
    request: () => User.client.query<Page.Instance>(vars.data),

    /** Requests the localized form of the page. */
    requestLocalized: () => User.client.query<Page.LocalizedInstance>(ql(q.Merge(
      qe.Filter(q.Var('data'), [
        'path', 'metadata', 'history', 'social', ['lang', q.Var('lang')]
      ]),
      qe.Filter(local, [
        'title', 'subtitle', 'description', 'template'
      ])))),

    /** Requests the `Social` document for the page. */
    requestSocial: () => User.client.query<Page.Social>(ql(qe.Data(q.Select('social', q.Var('data'))))),

    /** Requests the `title`, `subtitle`, and `description` fields. */
    requestDescription: () => User.client.query<Omit<Page.View, 'template'>>(ql(qe.Filter(local, [
      'title', 'subtitle', 'description'
    ])))
    // field
    // langs
    // meta?
    // template?
    // ratings
    // comments
    // upvote
    // mehvote
    // downvote
  }
}
