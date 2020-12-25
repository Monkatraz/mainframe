# Mainframe

### In Progress
- [ ] See if it is possible to entirely avoid serverless functions for page updates / creation
- [ ] Implement Popper
- [ ] Create a separate, more tightly bundled Monaco build package to be imported as a web_module
- [ ] Recreate def-list md-it plugin

### General
- [ ] Integrate ReCaptcha
  - Potentially prevent provision of a public API token if the user cannot pass a background ReCaptcha
  - Force passing a ReCaptcha when registering
- [ ] Generic cache library
- [ ] Add better page history schema
- [ ] Some sort of script or system for data-backups

### Users
- [ ] Author draft pages that are linkable
- [ ] Account deletion

### Components
- [ ] Login component
- [ ] Licensing Widget
- [ ] Humans.txt button
- [ ] Navbar dropdowns
- [ ] Search bar component
- [ ] Rating component
- [ ] Comments / Discussion Tab Component Thingy
- [ ] Top of page button

### Random Ideas
- Automatic repository pages (maybe a Markdown syntax for interfacing with the database)
- Notifications for users (new replies to their comments etc.)
- Table of contents to left of article when room is available
- Make a snowpack plugin for proxy.js files
- Signify how the user voted on the article when they comment
- Some sort of "alert" component that pops up and then fades programmatically

#### Editor
- Validations list to the side
- Single-pane Markdown cheat sheet
- Path type restrictions
	- "scp/scp-3685" is illegal (must be a 4 digit number)
	- Lock out certain number ranges

#### Page Router
- Vivaldi like loading bar
- Top right fixed spinner for page route changes
	
#### Keyboard Arrow Key Utility Grid Function Thingy
- List of arrays
- Elements or flow characters
		- Use characters like '<' and the like to denote how a downwards / upwards key press navigates to
- Wrap elements in a div that binds their flow axis in some particular direction?

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