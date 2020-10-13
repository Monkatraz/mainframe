/**
 * @file API for retrieving and updating pages through FaunaDB.
 * @author Monkatraz
 */

// FaunaDB
import FaunaDB, { Expr } from 'faunadb'
const q = FaunaDB.query
// Imports
import { qe, Clients, Ref, FaunaDate } from './api-fdb'

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
  /** May be null, or contain a reference to another Comment that this particular comment is replying to. */
  replyingto: Ref | null
  /** Content of the comment. */
  content: Subpage
}

// Page Interface

// TODO: Rename to be generalized to any html + pug content
/** `Subpage`s represent the set of objects that actually contain A `Page`'s consumable content.
 *  Includes the source template within the `src` field.
 */
export interface Subpage {
  html: string
  src: string
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
  /** Metadata - contains things like `Authors`, the current `revision`, etc. */
  meta: {
    // TODO: user object
    /** Set of users who authored this page and have edit permissions. */
    authors: Ref[]
    /** Number of revisions (edits) for this page. Starts at 1. */
    revision: number
    /** Date when this page was created. Use `.date()` method to convert to a JS `Date`. */
    dateCreated: FaunaDate
    /** Date when this page was last edited. Use `.date()` method to convert to a JS `Date`. */
    dateLastEdited: FaunaDate
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

// pull page to edit or read
// push page to remote
//    do diff
//    check valid updatable fields
//    update fields

// Functions

/** Request a page based off path. Eagerly loads the whole page. */
export function request(path: string) {
  const expr = qe.Data(qe.Search('pages_by_path', path))
  return Clients.Public.query<Page>(expr)
}

/** Requests a page based off path. 
 *  Lazy loads - fields will needed to be `await`ed or used with `.then()`.
 *  Returned object extends the `LazyDocument` type, which has a couple of utility functions. */
export function requestLazy(path: string) {
  const expr = qe.Data(qe.Search('pages_by_path', path))
  return Clients.Public.queryLazy<Lazyify<Page>>(expr)
}