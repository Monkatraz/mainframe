// Type Imports
import type { User } from './_users'

// Types
/** Tuple representing a user rating on a page. */
type Rating = [User, 1 | -1 | 0]

/** A list of page tags. */
type Tags = string[]

// Locals (Pages + Selected Language)

interface ILocalDescription {
  type: [id: string, meta: {}]
  title: string
  subtitle: string
  description: string
  authors: User[]
}

interface ILocalContent {
  flags: string[]
  html: string
  src: string
}

interface ILocal {
  desc: ILocalDescription
  root: ILocalContent
  subpages: {
    [id: string]: ILocalContent
  }
}

// Pages

interface IPageMetadata {
  revision: number
  dateCreated: Date
  dateLastEdited: Date
  ratings: Rating[]
  tags: Tags[]
}

// TODO: Add flags (like '_cc' or '_verified-licensing')
interface IPage {
  path: string
  meta: IPageMetadata
  locals: {
    [lang: string]: ILocal
  }
}

// Local Classes

class LocalDescription implements ILocalDescription {
  type: [id: string, meta: {}] = ['', {}]
  title: string = ''
  subtitle: string = ''
  description: string = ''
  authors: User[] = []

  constructor(from: Partial<ILocalDescription> = {}) {
    Object.assign(this, from)
  }
}

class LocalContent implements ILocalContent {
  flags: string[] = []
  html: string = ''
  src: string = ''

  constructor(from: Partial<ILocalContent> = {}) {
    Object.assign(this, from)
  }
}

class Local implements ILocal {
  desc = new LocalDescription
  root = new LocalContent
  subpages = {}

  constructor(from: Partial<ILocal> = {}) {
    Object.assign(this, from)
  }
}

// Page Classes

class Page implements IPage {
  path: string
  meta: IPageMetadata = {
    revision: 1,
    dateCreated: new Date,
    dateLastEdited: new Date,
    ratings: [],
    tags: []
  }
  locals = {
    'en': new Local
  }

  constructor(path: string = '') {
    this.path = path
  }
}

type Lazyify<T> = {
  [P in keyof T]: {
    (): Promise<T>
  }
}

// Page Loaders

interface ILazyLocalContent {
  flags: ILocalContent['flags']
  html: Promise<ILocalContent['html']>
  src: Promise<ILocalContent['src']>
}

interface ILazyLocal {
  desc: Promise<ILocalDescription>
  root: Promise<ILazyLocalContent>
  subpages: {
    [id: string]: Promise<ILazyLocalContent>
  }
}

interface ILazyPage {
  path: Page['path']
  meta: Promise<IPageMetadata>
  locals: Promise<{
    [lang: string]: Promise<ILazyLocal>
  }>
}

/**
 * LazyPage objects are a cached, lazy-loaded representation of remotely stored wiki Pages.
 * Getting certain properties of a LazyPage object will cause a promise to be returned.
 * Make sure to check the return type of the properties you are retrieving.
 */
class LazyPage {
  public path: string
  public isReady: boolean = false
  // Ready-gated properties
  private _ref: string = ''
  // Load from remote
  public ready: Promise<boolean> = this._init()

  constructor(path: string) {
    this.path = path
  }
  /**
   * Begins async. loading of the LazyPage object. Called immediately upon instantiation.
   */
  private async _init(): Promise<boolean> {
    // TODO: LazyPage init
    this._ref = ''
    this.isReady = true
    return true
  }

  // Helper Functions

  /** Returns a new Error object - meant for properties that were accessed too early. */
  private notReadyError(property: string): never {
    throw new Error(`Retrieved the property LazyPage['${property}] before the LazyPage was ready!`)
  }

  // Properties

  /** Returns the LazyPage's FaunaDB database reference. Throws an error if the LazyPage is not ready. */
  public get ref(): string {
    if (!this.isReady) this.notReadyError('ref')
    return this._ref
  }

}

// Full reference template for a Page
const PageTemplate: IPage = new Page

export { LazyPage, PageTemplate }
// TODO: Export types