# Mainframe
## An unofficial proof-of-concept for the [SCP-Wiki](www.scpwiki.com).

Mainframe is a personal attempt to create an affordable, modern replacement for the SCP-Wiki website.

Right off the bat, Mainframe is:
  * A _clean slate_. No considerations for legacy content were considered.
  * A modern site, using modern features. There is no IE11 support and there never will be.
  * An upgrade. Mainframe has a lot of things going for it compared to the old wiki. It's almost hard to call it a wiki
    \- it's entirely geared for just displaying pages and handling users.
  * High performance. Mainframe is heavily optimized for first-load times and smooth runtime performance.
  * Actually good mobile support, with touchscreen gestures.
  * Really accessible. A lot of work was put into a11y - although there is some limitations. (Must have JS, and unfortunately no Opera Mini support)
  * Finally, and absolutely most importantly: _cheap as hell._ Mainframe attempts to do literally everything as cheaply as possible. A SCP Wiki replacement has to support at least 10,000 active users.

There is a lot of technical implementation details I could talk about, but that's for later. This project is a huge learning experience and I hope the work I have done here can be put to use.

If you wish to know more about me, or contact me, you can go to [my personal website.](www.monkasite.com) If you're simply just curious and wish to ask a few questions, my DMs on Discord are open. \[Monkatraz#7929\]

### Some Shoutouts
This list is not inclusive. It is mostly for some people/projects that cannot be easily credited.
  * [Dimitar Donovski (u/ArduousIntent)](https://www.reddit.com/user/ArduousIntent) for their excellent SCP logo concept.
  * [grid-kiss](https://github.com/sylvainpolletvillard/postcss-grid-kiss): Converted into a Stylus plugin within the project.
  * [postcss-discard-overridden-props](https://github.com/mcler)

----
## Parameters
### Target
Create a replacement wiki-like system for the SCP-Wiki.
  * Navigate to user generated pages 
    - A slick, clean editor 
    - Page sources use Markdown
    - Search support
  * Users can create accounts and can use mild personalization features
    - Author pages
    - Display names can be changed at any time
    - Admin roles and tools
    - User preferences (e.g. language)
  * Pages have social features designed for the SCP community
    - Ratings
    - Discussion / Comments
      - Pinned comments
  * Accessible and semantic design, aka full a11y support

### Constraints
  * Must be absurdly cheap to operate
  * Must support up to 10,000 active users
  * Use only modern web technology and markup
  * Speedy and native-like web experience if possible

### Anti-Constraints
  * Explicit lack of IE11 support
  * ESNext codebase, compiled down using a transpiler only if needed

### Security and Privacy
  * Must use a restrictive content security policy
  * Use only `HTTPS`
  * No significant monitoring or storage of fingerprint-like user-data
    - If possible, the only confidential data that should be stored specific to users is their email, (securely handled)
      password, and user preferences.
  * Use only opt-in personalization
  * Prevent mass scraping of the public database

### Not Doing
  * Advertisement slots
    - Why? Because I hate ads, and this is meant to be cheap. It shouldn't need ads if it can be cheap enough to be self-hosted by the community through donations. 
  * Replacement for the forums
    - Forum hosting would likely require custom software and complete server hosting. It would likely be much more
      cost-effective to just use public services like Discord, IRC, etc.
  * Legacy database migration and to-native conversion

### Non-MVP Targets
There are various features Mainframe would need to support if it were to actually be used.
  * Complete multi-lingual support, with verification that RTL and LTR text works correctly
  * Email service, e.g. account verification or password resets
  * Legacy content renderer
  * Pass a security audit
  * Potentially have a test suite for the codebase
  * Solution for storing binary data such as images
  * Bootstrap script for setting up database instances either locally or on a development remote

### Unknowns
  * Would admins be limited to a language?
  * How would non-English wikis work?
    - Separate repositories?
  * What inexpensive service could be used to store binary data?
    - Incredibly aggressive image compression and resizing?
    - S3 bucket?
    - Use FaunaDB again but store binaries in string buffers?
      - Permanent links would be difficult with this solution.

----
## Basic Architecture
Mainframe is a static, single-page-application. Mainframe interacts with its remote database using only serverless functions and client-side API calls. This is part of the reason why Mainframe is cheap to run, as it basically _isn't_ whenever nobody is using it.

In order to actually be functional as a wiki, Mainframe makes heavy use of FaunaDB. FaunaDB itself is a document-based database. It is extremely well-suited for a wiki, although it doesn't do well with binary data. Mainframe is tightly integrated with FaunaDB, with the database API natively using FQL expressions and maximizing usage of FaunaDB's advanced features. 

The integration between Mainframe and FaunaDB is to the point that it is near-certain that a guest will never need to invoke a serverless function. Nearly all interaction with the site can be expressed as direct client to database API interactions.

## Assets
Most of Mainframe's assets are either compiled or built. Mainframe is primarily written in:
  * TypeScript
  * HTML
  * Stylus + PostCSS
  * Svelte

Some JavaScript is used for development tools, like Snowpack compilers, but the Mainframe codebase is written in TypeScript.

Most sources can be found in the `src` folder. Some additional assets can be found in the `public` folder - these assets have no build step and are just directly copied into the build target folder by Snowpack. Certain source files and development tools can be found within the `dev` folder.

## Used Runtime Libraries
Mainframe makes heavy runtime use of various JavaScript libraries - but these have all been chosen based on their minimal size and narrow scope. Mainframe does not use Vue, React, or any other runtime virtual DOM library, and instead uses Svelte.

\- todo: update -

Here are the main ones:
  * FaunaDB's JS driver for the database API
  * Svelte for reactive components
  * Tippy.js for accessible popovers and tooltips
  * Anime.js for animations
  * Prism.js for syntax highlighting

Libraries likely to be added, but not yet:
  * Workbox for PWA support and client-side caching
  * Chart.js for, well, charts

-----

## Development & Tools
Assets wise, Mainframe is really simple to build. Mainframe uses [Snowpack](www.snowpack.dev/) for both development and production asset building. The toolchain is very automatic and requires little knowledge of how it internally works.

However, actually hosting the site can be a challenge, and there is not currently a procedure to do so.

### Dependencies
Mainframe has a fair number of dependencies. All of them can be found in the `package.json` and installed using NPM.

They are sorted like so:
  * `dependencies:` are for any runtime packages that the users will download and use.
  * `devDependencies:` are for any packages required to build the site.
  * `optionalDependencies:` are for any other packages, e.g. `eslint`.

### Building Locally
Mainframe is very easy to build.

1. `git clone` this repository somewhere on your system. You can use GitHub desktop or IDE/editor plugins to easily
   clone this repo.
2. Open the local repository in a terminal and run `npm i`. This may take a while.
3. Once that is done, simply run the build script with `npm run build`. The entire website will be output to the newly
   created `build` folder once the build is complete.

### Running Locally
Running locally is slightly more complex. In order to function correctly, Mainframe needs to be connected to a FaunaDB database. It is difficult to run one locally, and there is presently no existing developer-oriented API module for internal development.

\- todo: dev/run -

## Contributing

\- todo: contributing -

## Deploying
As Mainframe is hosted on Netlify, any changes made to the `master` branch in this repository will automatically cause the site to be deployed.

## License
MIT.