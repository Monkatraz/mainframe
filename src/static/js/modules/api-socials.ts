/**
 * @file API for working with references to socials (other users).
 * @author Monkatraz
 */

// FaunaDB
import FaunaDB from 'faunadb'
const q = FaunaDB.query
// Imports
import type { Ref } from './api-fdb'
import type { Subpage } from './api-page'

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