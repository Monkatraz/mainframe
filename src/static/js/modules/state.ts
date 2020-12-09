/**
 * @file Exports the global state for Mainframe.
 * @author Monkatraz
 */

/** Contains all environment variables. */
export const ENV = {
  /** API related env. variables. Usually database related. */
  API: {
    // Database
    FDB_PUBLIC: import.meta.env.SNOWPACK_PUBLIC_API_FDB_PUBLIC,
    FDB_DOMAIN: import.meta.env.SNOWPACK_PUBLIC_API_FDB_DOMAIN,
    // Serverless functions
    LAMBDA: import.meta.env.SNOWPACK_PUBLIC_API_LAMBDA
  },
  HOMEPAGE: import.meta.env.SNOWPACK_PUBLIC_HOMEPAGE
}

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

/** Represents the current user - regardless of if they are logged in or not. */
export const User = {
  isLoggedIn: false,
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
  },
  // TODO: Logging in / out
  login(email: string, password: string) {
    User.isLoggedIn = true
  },
  logout() {
    User.isLoggedIn = false
  }
}