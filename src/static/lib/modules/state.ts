/**
 * @file Stores 'state' relevant objects, like environment variables, useragent state, etc.
 *       For authentication state, check `api.ts`.
 * @author Monkatraz
 */

import { IDBPDatabase, DBSchema, openDB } from 'idb/with-async-ittr'
import { writable } from 'svelte/store'
import type { Page } from '@schemas'

// -- CONSTANTS

/** Contains all "environment" variables.
 *  They're just inlined in the code because that is what Snowpack would've done anyways. */
export const ENV = {
  /** API related env. variables. Usually database related. */
  API: {
    // Database
    FDB_PUBLIC: 'fnAD_o-GF3ACAjp24m6GKwf87jYlTEbFqwOVPIH3',
    FDB_DOMAIN: 'db.fauna.com',
    // Serverless functions
    LAMBDA: '/api/'
  },
  HOMEPAGE: '/admin/home'
}

// -- AGENT / CONTEXT

/** Browser / User-Agent info. Contains contextual information like normalized mouse position values. */
export namespace Agent {
  // State
  export let mouseX = 0
  export let mouseY = 0
  export let scroll = 0
  // Flags
  export const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  // Set up our listeners
  window.addEventListener('mousemove', (evt) => {
    mouseX = evt.clientX / window.innerWidth
    mouseY = evt.clientY / window.innerHeight
  })

  window.addEventListener('scroll', () => {
    scroll = document.documentElement.scrollTop / (document.body.scrollHeight - window.innerHeight)
  })
}

// -- TOASTS

interface Toast {
  type: 'success' | 'danger' | 'warning' | 'info'
  message: string
  remove: () => void
}

/** A stored immutable `Set` containing the currently visible toasts. */
export const toasts = writable<Set<Toast>>(new Set())

/** Displays a 'toast' notification to the user. Provide a `time` of `0` to prevent the notification
 *  from automatically closing. */
export function toast(type: 'success' | 'danger' | 'warning' | 'info', message: string, time = 5000) {
  const remove = () => { toasts.update((cur) => { cur.delete(toastData); return new Set(cur) }) }
  const toastData = { type, message, remove }
  toasts.update(cur => new Set(cur.add(toastData)))
  // delete message after timeout
  if (time) setTimeout(remove, time)
}

// -- DRAFT DATABASE

/** Namespace for the LocalDrafts IndexDB database. */
export namespace LocalDrafts {

  interface DraftDatabase extends DBSchema {
    drafts: {
      key: string
      value: Page.LocalDraft
      indexes: {
        name: string
      }
    }
  }

  let db: IDBPDatabase<DraftDatabase>

  // init
  const ready = (async () => {
    db = await openDB<DraftDatabase>('Local_Drafts', 1, {
      upgrade(db) {
        const store = db.createObjectStore('drafts', {
          keyPath: 'name'
        })
        store.createIndex('name', 'name')
      }
    })
  })()

  /** Gets a page by its name. Throws if the page does not exist. */
  export async function get(name: string) {
    await ready
    const result = await db.get('drafts', name)
    if (!result) throw new Error('No such page in database!')
    return result
  }

  /** Returns whether or not the page specified by name exists already. */
  export async function has(name: string) {
    await ready
    return !!(await db.getKey('drafts', name))
  }

  /** Returns the names of all drafts currently in the database. */
  export async function currentDrafts() {
    await ready
    return await db.getAllKeysFromIndex('drafts', 'name')
  }

  /** Adds a page. Returns the name of the page. Throws if the page already exists. */
  export async function add(page: Page.LocalDraft) {
    await ready
    if (!page.name) throw new Error('Invalid page name!')
    return await db.add('drafts', page)
  }

  /** Adds a page, overwriting if needed. Returns the name of the page. */
  export async function put(page: Page.LocalDraft) {
    await ready
    const name = page.name
    if (!name) throw new Error('Invalid page name!')
    return await db.put('drafts', page)
  }

  /** Removes a page by name. Throws if the page does not exist. */
  export async function remove(name: string) {
    await ready
    const idx = await db.getKey('drafts', name)
    if (!idx) throw new Error('No such page in database!')
    await db.delete('drafts', idx)
  }

}

// -- PREFERENCES

/** Helper user preferences object. */
export const Pref = {
  /** Attempt to retrieve the preference with the given name.
   *  If it isn't found, the fallback value will instead be returned. */
  get<T = JSONValue>(name: string, fallback: T): T {
    name = '_user-pref_' + name
    const storedPreference = localStorage.getItem(name)
    if (storedPreference) return JSON.parse(storedPreference) as T
    else return fallback
  },

  /** Sets the preference with the given name to the given value.
   *  Passing an empty string will remove the preference from storage. */
  set<T = JSONValue>(name: string, value: T) {
    name = '_user-pref_' + name
    if (!value) localStorage.removeItem(name)
    else localStorage.setItem(name, JSON.stringify(value))
    return value
  },

  /** Returns if the requested preference is available in storage. */
  has(name: string) {
    name = '_user-pref_' + name
    return !!localStorage.getItem(name)
  },

  /** Returns a writable store that maps to the given preference. */
  bind<T = JSONValue>(name: string, fallback: T) {
    const store = writable(this.get(name, fallback))
    return {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      subscribe: store.subscribe,
      set: (val: T) => {
        store.set(typeof val === 'object' ? { ...val as any } : val)
        this.set(name, val)
      }
    }
  },

  /** Retrieves a 'wrapped' proxy object, or creates one if needed.
   *  Setting items on this object will automatically cause the object to be stored.
   *  This can be used to store a record of preferences without needing to use an observable store. */
  wrap<T extends JSONObject>(name: string, fallback: T): T {
    const wrapped = this.get(name, fallback)
    const handler: ProxyHandler<T> = {
      // handle nested objects by proxying them with the same handler
      get: (target, prop) => {
        const val = Reflect.get(target, prop)
        return typeof val === 'object' ? new Proxy(val, handler) : val
      },
      // fire setter function whenever the object has a property set (even recursively)
      set: (target, prop, val) => {
        Reflect.set(target, prop, val)
        this.set(name, wrapped)
        return true
      }
    }
    return new Proxy(wrapped, handler)
  }
}

// -- MEDIA QUERIES

const sizeMap = new Map()
const sizes = ['narrow', 'thin', 'small', 'normal', 'wide'] as const

// This makes our map associated both ways:
// 0 = thin, thin = 0.
sizes.forEach((size: string, i) => {
  sizeMap.set(size, i)
  sizeMap.set(i, size)
})

/** Contains the media queries for the window size breakpoints.
 *  Narrow is not included as it is the default size if none of the others are valid. */
const sizeQueries = {
  thin: window.matchMedia('(min-width: 400px)'),
  small: window.matchMedia('(min-width: 800px)'),
  normal: window.matchMedia('(min-width: 1000px)'),
  wide: window.matchMedia('(min-width: 1400px)')
}

let curSize = 'thin'

/** Updates the `curSize` variable with the current window size. */
function updateSize() {
  for (let i = 1; i < sizes.length; i++) {
    if (sizeQueries[sizes[i] as keyof typeof sizeQueries].matches === false) {
      curSize = sizeMap.get(i - 1)
      break
    } else {
      curSize = sizeMap.get(sizes.length - 1)
    }
  }
  window.dispatchEvent(new Event('MF_MediaSizeChanged'))
}

updateSize()

// Add our event listeners, so that no polling is needed.
for (const size in sizeQueries) {
  sizeQueries[size as keyof typeof sizeQueries].addEventListener('change', updateSize)
}

type MediaSize = 'narrow' | 'thin' | 'small' | 'normal' | 'wide'
type MediaInclusivity = 'only' | 'up' | 'below'

/** Reactive function (store) that checks if the specified size matches against the inclusivity operator. */
export const matchMedia = {
  /** Checks if the specified size matches against the inclusivity operator. */
  call(size: MediaSize, inclusivity: MediaInclusivity) {
    // Our size map means this function is relatively simple.
    // Larger sizes have their mapped integer higher than the previous.
    // We can use this to compare curSize to our specified size.
    switch (inclusivity) {
      case 'only':
        return curSize === size
      case 'up':
        return sizeMap.get(curSize) >= sizeMap.get(size)
      case 'below':
        return sizeMap.get(curSize) <= sizeMap.get(size)
    }
  },
  subscribe(sub: (match: (size: MediaSize, inclusivity: MediaInclusivity) => boolean) => void) {
    sub(this.call)
    const eventFn = () => { sub((s, i) => this.call(s, i)) }
    window.addEventListener('MF_MediaSizeChanged', eventFn)
    return () => window.removeEventListener('MF_MediaSizeChanged', eventFn)
  }
}
