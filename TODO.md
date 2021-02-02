# Mainframe

### In Progress
- [ ] Page creation, and updating
- [ ] Author draft pages that are linkable
- [ ] Rename 'User' to 'Account' and rename 'Social' to 'User'
- [ ] Go thorugh components and give decently scoped names so that they can be themed

### Markdown
- [ ] Recreate def-list md-it plugin
- [ ] Dynamic Svelte components generation

### General
- [ ] Integrate ReCaptcha?
  - Potentially prevent provision of a public API token if the user cannot pass a background ReCaptcha
  - Force passing a ReCaptcha when registering
- [ ] Generic cache library
- [ ] Implement `svelte-i18n` and create a basic `en` language mapping
- [ ] Update the account creation and login forms to use forms correctly
- [ ] Account settings
- [ ] Make critic comments a bit smarter somehow, they don't work very well on mobile
- [ ] Separate 404 page so that indexing works correctly
- [ ] Set page metadata in the `<head>` when loading pages
- [ ] Support specificity in the language modes for pages
  - e.g. if there is no `en-us` local, but there is `en`, it will pick that one

### Components
- [ ] Licensing Widget
- [ ] Search bar component
- [ ] Rating component
- [ ] Comments / Discussion Tab Component Thingy
- [ ] Top of page button
- [ ] Share widget
- [ ] Overlay scrollbar component
- [ ] The Admin Panel
- [ ] Modal component that is definable where it is used (svelte portal + conditional rendering)

### Random Ideas
- Automatic repository pages (maybe a Markdown syntax for interfacing with the database)
- Notifications for users (new replies to their comments etc.)
- Signify how the user voted on the article when they comment

#### Editor
- Single-pane Markdown cheat sheet

### Done
- [x] Create private database
- [x] FaunaDB basic API
- [x] FaunaDB API
- [x] Netlify hosting
- [x] Path aliases
- [x] Add Iconify
- [x] Add Prism.js
- [x] Lazy loader module
- [x] Page appearance and staff-controlled page flags schema
- [x] Create a private user-data schema
- [x] Create a public user-data schema
- [x] Object schema validation function collection
- [x] Create user collection and basic login system
- [x] Create a flattened page schema with reduced nesting
- [x] Port previous CSS over
- [x] Change Prism.js color scheme to a better one
- [x] Create a page generator script
- [x] Minimum needed for Netlify API
- [x] Svelte compiling
- [x] Svelte Stylus-PostCSS
- [x] Change the SVG logo to not use an inline script
- [X] Page component basic page loading
- [x] Spinner component
- [x] Svelte component loader
- [x] Add Tippy.js
- [x] Add Anime.js Svelte library
- [x] Add custom 404 page
- [x] Tippy component or wrapper library
- [x] Gesture controls
- [x] Better logo icon thingy
- [x] Page router
- [x] Global state handler module to isolate components from routing and state
- [x] App load animation
- [x] Add markdown-it
- [x] Add DOMPurify
- [x] Add a local test page (dummy data?)
- [x] Navbar
- [x] Make netlify-cli not required to run the dev server
- [x] Remove CSSNano and depend on ESBuild to optimize CSS
- [x] Nuke Netlify
- [x] Try to remove more PostCSS plugins
- [x] Get rid of PostCSS-center (update header)
- [x] Generic web workers
- [x] Switch to Vercel due to even better pricing and FOSS ideals
- [x] Add Monaco editor component and Markdown lang.
- [x] Implement Prism into the Markdown render worker directly somehow
- [x] Switch to CodeMirror due to Monaco being fairly under supported in the client-space
- [x] Move all components and JS into a `/lib` folder
- [x] Add sidebar
- [x] Add tooltips / hints
- [x] Login component
- [x] Add a media-size Svelte store
- [x] Create data-files in `yaml` and compile with Snowpack to `JSON`
- [x] Add better page history schema
- [x] Markdown rendering component (with morphing support/flag)
- [x] Toasts
- [x] Navbar dropdowns
- [x] Add some sort of `pref` object that handles localStorage shenanigans automatically
- [x] Tabs
- [x] Drafts stored either with `localStorage` (must be serialized)
- [x] Generic worker handler
