// Imports for FaunaDB types
import type { values as v } from 'faunadb'
type Ref = v.Ref

// -------
//  USERS

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
  /** Contains the history of a comment, such as its current revision. */
  history: {
    /** The total number of revisions (edits) for this comment. Starts at 1. */
    revision: number
    /** Date when this comment was created. */
    dateCreated: Date
    /** Date when this comment was last edited. */
    dateLastEdited: Date
  }
  /** Markdown content of the comment. Must be rendered in order to view. */
  template: string
}

// -------
//  PAGES

export namespace Page {

  /** Metacontextual and contextual metadata of a page, mostly in regards to its contents. */
  export interface Metadata {

    // -- Metacontextual

    /** Describes the general purpose of the page's content.
     *  The type, due to its importance, serves as the first component of the URL of a page. */
    type: string
    /** The flags assigned to the page, usually by staff.
     *  Flags affect the behavior of the page, e.g. by locking it or by affecting how it renders. */
    flags: string[]
    /** The attribute tags assigned to the page.
     *  Attributes are metacontextual (i.e. about the page, not the content).
     *  They can be arbitrarily chosen, depending on the needs of the page and author. */
    attributes: string[]
    /** The content warnings assigned to the page.
     *  These warnings serve to inform the reader of potentially distressing content. */
    warnings: string[]

    // -- Contextual

    /** The fictional context of the page. e.g. 'foundation' or 'serpents-hand'. */
    context: string
    /** The list of canons the page belongs in. */
    canons: string[]
    /** The content tags assigned to the page.
     *  Plain tags describe, usually, narrative elements present within the page's contents. */
    tags: string[]
  }

  /** Contains the history of a page, such as its current revision. */
  export interface History {
    /** The total number of revisions (edits) for this page. Starts at 1. */
    revision: number
    /** Date when this page was created. */
    created: Date
    /** Date when this page was last edited. */
    lastEdited: Date
    /** The author of the latest revision. */
    lastAuthor: Ref
  }

  /** Contains the 'social' data of a page, such as its ratings and comments.
   *  Its important that this is in a separate document, so that pages only ever update with revisions. */
  export interface Social {
    /** Ratings data for the page, sorted into the 'up', 'meh', and 'down' pools of users, indicating how they voted.
     *  It's split up this way to make it easy to count the ratings of each type and do calculations with them.
     *  This of course has the tradeoff of making it more difficult to find how a particular user voted. */
    ratings: {
      up: Ref[]
      meh: Ref[]
      down: Ref[]
    }
    /** The page's comments, sorted from first comment to last comment. */
    comments: Comment[]
  }

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

  /** Root level object retrieved from the FaunaDB database. Contains everything relevant to a page. */
  export interface Instance {
    /** Version number, used for backwards compatibility handling (if needed) */
    version: number
    /** URL path, starting from root. Is always unique. */
    path: string
    /** Set of users who authored this page and have edit permissions. */
    authors: Ref[]
    /** Metadata - contains tags and other context-related things. */
    metadata: Metadata
    /** History information, such as the current revision and edit dates. */
    history: History
    /** FDB reference to the `Social` document for the page. */
    social: Ref
    /** Dictionary-like object (e.g `en: {}`) listing all versions of this page.
     *  Fields denote which language the `View` is for. */
    locals: {
      [lang: string]: View
    }
  }

  /** Minimal form of a page instance, localized to a specific language. */
  export interface LocalizedInstance {
    /** Version number, used for backwards compatibility handling (if needed) */
    version: number
    /** URL path, starting from root. Is always unique. */
    path: string
    /** Set of users who authored this page and have edit permissions. */
    authors: Ref[]
    /** Metadata - contains tags and other context-related things. */
    meta: Metadata
    /** History information, such as the current revision and edit dates. */
    history: History
    /** FDB reference to the `Social` document for the page. */
    social: Ref
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
}
