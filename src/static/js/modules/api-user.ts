/**
 * @file API for handling the User (client) object.
 * @author Monkatraz
 */

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
    langauge: 'en' // TODO: List of languages instead?
  }
}