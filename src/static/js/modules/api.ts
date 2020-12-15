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
import { ENV } from '@modules/util'

// ---------
//  FAUNADB

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

// --------
//  SOCIAL

export interface Social {
  /** A reference to the user's actual User document.
   *  This document cannot actually be read - but this reference serves as the canonical ID for this user.
   *  Additionally, the actual ID of the `Ref` (not the collection) serves as the URL path for the user. */
  user: Ref
  /** A page (a markdown template) specific to the user. Only they can edit it. */
  authorpage: string
  /** The nickname for this user. They can change it at any time. */
  nickname: string
  /** A very short description for the user.
   *  It is intended for info like pronouns, as it is always displayed with the user. Optional. */
  tagline: string
  /** A more formal, and longer, description for the user. Optional. */
  bio: string
}

/** `Comment` objects represent single comments created by users. */
export interface Comment {
  /** Reference to the author of the comment. */
  author: Ref
  /** General metadata, like current revision and creation date. */
  meta: {
    /** Number of revisions (edits) for this comment Starts at 1. */
    revision: number
    /** Date when this comment was created. */
    dateCreated: Date
    /** Date when this comment was last edited. */
    dateLastEdited: Date
  }
  /** Markdown content of the comment. Must be rendered in order to view. */
  content: string
}

// -------
//  PAGES

/** Tuple representing a user rating on a page. */
type Rating = [Ref, 1 | -1 | 0]
/** A list of page tags. */
type Tags = string[]

/** `View` objects represent a particular language variant of a page. */
export interface View {
  /** Page title. */
  title: string
  /** Page subtitle. */
  subtitle: string
  /** Short page description. */
  description: string
  /** Markdown page template. Must be rendered to be viewed. */
  template: string
}

// TODO: convert Ratings[] into { up: Ref[], meh: Ref[], down: Ref[] }
// TODO: Move `social` into its own document
/** Root level object retrieved from the FaunaDB database. Contains everything relevant to a `Page`. */
export interface Page {
  /** URL path, starting from root. Is always unique. */
  path: string
  /** Metadata - contains things like the current `revision`, edit dates, etc. */
  meta: {
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
    flags: string[]
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

/** Minimal form of a `Page` object, localized to a language and with no `social` data included. */
export interface LocalizedPage {
  /** URL path, starting from root. Is always unique. */
  path: string
  /** Version number, used for backwards compatibility handling (if needed) */
  version: number
  /** Metadata - contains things like authors, current `revision`, edit dates, etc. */
  meta: Page['meta']
  /** Language that this particular localized page is in. */
  lang: string
  /** Page title. */
  title: string
  /** Page subtitle. */
  subtitle: string
  /** Short page description. */
  description: string
  /** Markdown page template. Must be rendered to be viewed. */
  template: string
}

/** Gets the status code of any error, defaulting to 400.
 *  Has special handling for `FaunaHTTPError`s.
 */
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
    return qe.IfMap(q.Abort('400'), [
      [q.IsObject(obj), q.Map(q.ToArray(obj), lambda)],
      [q.IsArray(obj), obj]
    ])
  },

  /** "Searches" and returns matches using the specified index.
   * 
   *  Shorthand for `q.Match(q.Index(index))`.
   */
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
        'langs': qe.Fields(q.Select('locals', obj)),
        'intersect': q.Intersection(User.preferences.langs, q.Var('langs')),
        'lang': q.If(q.Not(q.IsEmpty(q.Var('intersect'))),
          q.Select(0, q.Var('intersect')),
          q.Select(0, q.Var('langs'))
        )
      },
      q.Var('lang')
    )
  },

  /** Filters an input FDB-side obj. using arrays of key names. */
  Filter(obj: Expr, filter: (string | [string, (string | Expr)[] | Expr])[]) {
    const filterObj: { [K: string]: Expr } = {}
    filter.forEach((key) => {
      // [key, Expr | []] format
      if (key instanceof Array) {
        if (key[1] instanceof Array) filterObj[key[0]] = q.Select(key[1], q.Var('fdobj'))
        else filterObj[key[0]] = key[1] // Don't select, just use the FDB Expr
      }
      // Key list format
      else filterObj[key] = q.Select(key, q.Var('fdobj'))
    })
    return q.Let({ 'fdobj': obj }, filterObj)
  }
}

class Client {
  private client!: FaunaDB.Client
  public query!: FaunaDB.Client['query']
  public paginate!: FaunaDB.Client['paginate']
  constructor (key: string) {
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

type ModeGuest = { loggedIn: false, client: Client }
type ModeUser = {
  loggedIn: true, client: Client
  id: Ref, token: string, social: Social
}
/** Represents the current user. */
const User = {
  // type wizardy that allows for `User.loggedIn` type narrowing without nested objects being needed
  ...{ loggedIn: false, client: new Client(ENV.API.FDB_PUBLIC) } as (ModeUser | ModeGuest),

  preferences: {
    langs: ['en']
  },
  /** Creates an account registration event. Does not sign the guest in. */
  async guestRegister(email: string, password: string) {
    if (User.loggedIn) throw new Error()
    await User.client.invoke<Ref>('guest_register', email, password)
  },
  /** Signs an unsigned guest in using the provided credentials. */
  async login(email: string, password: string) {
    if (User.loggedIn) throw new Error()
    const res = await User.client
      .invoke<{ instance: Ref, secret: string }>('guest_login', email, password)
    // Assigns is used here for cleanliness and also because type wizardy
    Object.assign(User, {
      loggedIn: true,
      id: res.instance, token: res.secret,
      social: await User.client.invoke<Social>('socials_of', res.instance),
      client: new Client(res.secret)
    })
  },
  /** Signs out a signed in user. Nullifies all tokens. */
  async logout() {
    if (!User.loggedIn) throw new Error()
    await User.client.query(q.Logout(true))
    Object.assign(User,
      { loggedIn: false, client: new Client(ENV.API.FDB_PUBLIC) },
      { id: undefined, token: undefined, social: undefined }) // clear out mem. of old values
  }
}

/** Smart Page API handler function. */
export function withPage(path: string, lang: string | Expr = qe.PageLang(q.Var('data'))) {
  const vars = { 'data': qe.Data(qe.Search('pages_by_path', path as Expr)), 'lang': lang }
  const local = q.Select(['locals', q.Var('lang')], q.Var('data'))
  const ql = (expr: Expr) => q.Let(vars, expr)
  return {
    /** Requests the entirety of the page. */
    request: () => User.client.query<Page>(vars.data),
    /** Requests the localized form of the page. */
    requestLocalized: () => User.client.query<LocalizedPage>(ql(q.Merge(
      qe.Filter(q.Var('data'), [
        'path', 'meta', ['lang', q.Var('lang')]
      ]),
      qe.Filter(local, [
        'title', 'subtitle', 'description', 'template'
      ])))),
    /** Requests just the `social` record. */
    requestSocial: () => User.client.query<Page['social']>(ql(q.Select('social', q.Var('data')))),
    /** Requests the `title`, `subtitle`, and `description` fields. */
    requestDescription: () => User.client.query<Omit<View, 'template'>>(ql(qe.Filter(local, [
      'title', 'subtitle', 'description'
    ])))
    // field
    // ratings
    // comments
    // langs
    // meta?
    // template?
    // upvote
    // mehvote
    // downvote
  }
}

const pageTemplate: Page = {
  path: '/scp/6842',
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
      title: 'SCP-6842',
      subtitle: 'Something Else Entirely',
      description: 'Very interesting description!',
      template: `# Mainframe
## An unofficial proof-of-concept for the [SCP-Wiki](www.scpwiki.com).

[![Netlify Status](https://api.netlify.com/api/v1/badges/78e6519c-b9ab-440a-9a77-ef79694eac65/deploy-status)](https://app.netlify.com/sites/scp-mainframe/deploys)

Mainframe is a personal attempt to create an affordable, modern replacement for the SCP-Wiki website.

Right off the bat, Mainframe is:
  * A _clean slate_. No considerations for legacy content were considered.
  * A modern site, using modern features. There is no IE11 support and there never will be.
  * An upgrade. Mainframe has a lot of things going for it compared to the old wiki. It's almost hard to call it a wiki
    \\- it's entirely geared for just displaying pages and handling users.
  * High performance. Mainframe is heavily optimized for first-load times and smooth runtime performance.
  * Actually good mobile support, with touchscreen gestures.
  * Really accessible. A lot of work was put into a11y - although there is some limitations. (Must have JS, and unfortunately no Opera Mini support)
  * Finally, and absolutely most importantly: _cheap as hell._ Mainframe attempts to do literally everything as cheaply as possible. A SCP Wiki replacement has to support at least 10,000 active users.

There is a lot of technical implementation details I could talk about, but that's for later. This project is a huge learning experience and I hope the work I have done here can be put to use.

If you wish to know more about me, or contact me, you can go to [my personal website.](www.monkasite.com) If you're simply just curious and wish to ask a few questions, my DMs on Discord are open. \\[Monkatraz#7929\\]

### Some Shoutouts
This list is not inclusive. It is mostly for some people/projects that cannot be easily credited.
  * [Dimitar Donovski (u/ArduousIntent)](https://www.reddit.com/user/ArduousIntent) for their excellent SCP logo concept.
  * [grid-kiss](https://github.com/sylvainpolletvillard/postcss-grid-kiss): Converted into a Stylus plugin within the project.
  * [postcss-discard-overridden-props](https://github.com/mcler)

----
## Parameters
### Target
Create a replacement wiki-like system for the SCP-Wiki.
  * Navigate to user generated pages 
    - A slick, clean editor 
    - Page sources use Markdown
    - Search support
  * Users can create accounts and can use mild personalization features
    - Author pages
    - Display names can be changed at any time
    - Admin roles and tools
    - User preferences (e.g. language)
  * Pages have social features designed for the SCP community
    - Ratings
    - Discussion / Comments
      - Pinned comments
  * Accessible and semantic design, aka full a11y support

### Constraints
  * Must be absurdly cheap to operate
  * Must support up to 10,000 active users
  * Use only modern web technology and markup
  * Speedy and native-like web experience if possible

### Anti-Constraints
  * Explicit lack of IE11 support
  * ESNext codebase, compiled down using a transpiler only if needed

### Security and Privacy
  * Must use a restrictive content security policy
  * Use only \`HTTPS\`
  * No significant monitoring or storage of fingerprint-like user-data
    - If possible, the only confidential data that should be stored specific to users is their email, (securely handled)
      password, and user preferences.
  * Use only opt-in personalization
  * Prevent mass scraping of the public database

### Not Doing
  * Advertisement slots
    - Why? Because I hate ads, and this is meant to be cheap. It shouldn't need ads if it can be cheap enough to be self-hosted by the community through donations. 
  * Replacement for the forums
    - Forum hosting would likely require custom software and complete server hosting. It would likely be much more
      cost-effective to just use public services like Discord, IRC, etc.
  * Legacy database migration and to-native conversion

### Non-MVP Targets
There are various features Mainframe would need to support if it were to actually be used.
  * Complete multi-lingual support, with verification that RTL and LTR text works correctly
  * Email service, e.g. account verification or password resets
  * Legacy content renderer
  * Pass a security audit
  * Potentially have a test suite for the codebase
  * Solution for storing binary data such as images
  * Bootstrap script for setting up database instances either locally or on a development remote

### Unknowns
  * Would admins be limited to a language?
  * How would non-English wikis work?
    - Separate repositories?
  * What inexpensive service could be used to store binary data?
    - Incredibly aggressive image compression and resizing?
    - S3 bucket?
    - Use FaunaDB again but store binaries in string buffers?
      - Permanent links would be difficult with this solution.

\`\`\`ts
  /** Eagerly loads the rest of the LazyDocument. */
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

  /** Returns the requested field as another LazyDocument.
   *  The requested field _must_ be an object for this to work. LazyDocument requires key-value pairs. */
  public async _getLazy<K extends string & keyof T>(field: K): Promise<Lazyify<T[K]> & LazyDocument<T[K]>> {
    const lazydoc = await new LazyDocument<T[K]>(q.Select(field, this._requestExpr), this._client)._start()
    this._setField(field, lazydoc)
    return lazydoc as Lazyify<T[K]> & typeof lazydoc
  }
\`\`\``
    }
  }
}

// invokeLambda('page-update', pageTemplate).then(console.log)