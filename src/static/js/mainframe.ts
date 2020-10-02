'use strict'
// Library Imports
// import * as Async from './util/_async'
import './_pages'
import './_database'

// Constants

// Client
// TODO: Implement LocalStorage stuff
const Client = {
  username: 'Guest',
  // FaunaDB User Auth
  auth: {
    // The amount of sensitive data here should be minimized as much as possible
    id: '',
    token: ''
  },
  // LocalStorage preferences
  preferences: {
    langauge: 'en' // TODO: List of languages instead?
  }
}
