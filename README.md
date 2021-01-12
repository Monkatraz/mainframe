# Mainframe
## An unofficial proof-of-concept for the [SCP-Wiki](www.scpwiki.com).

Mainframe is a personal attempt to create an affordable, modern replacement for the SCP-Wiki website. It's not complete - and I would've liked to have progressed significantly further before making it public, but I didn't want to go much further on its fundamental design without public opinion.

Right off the bat, Mainframe is:
  * A _clean slate_. No considerations for legacy content were considered. This is to allow as much innovation as possible within its design.
  * A modern site, using modern features and sporting proper mobile support. There is no IE11 support and there never will be.
  * A functional upgrade. Mainframe has a lot of things going for it compared to the old wiki. It's almost hard to call it a wiki \- it's entirely geared for just displaying pages and handling users.
  * High performance. Mainframe is heavily optimized for first-load times and smooth runtime performance.
  * Really accessible. A lot of work was put into a11y - although there is some limitations. (Must have JS, meaning unfortunately no Opera Mini support) There is a simple truth that must be noted: the original wiki has utterly awful accessibility, which is almost entirely due to Wikidot.
  * Finally, and most importantly: _cheap as hell._ Mainframe attempts to do literally everything as cheaply as possible. A SCP Wiki replacement has to support at least 10,000 active users. Mainframe is a static website with no server backend. It runs entirely between the client and the database. This is the killer-feature of Mainframe and its entire design revolves around it.

Here is what it has that's new, at-least compared to Wikidot:
  * A slick, fast, and custom-tuned CodeMirror 6 editor. Seriously - if there was a _single feature_ you could take from Mainframe, it needs to be the editor. It sports live-preview, full-screen editing, drafts, syntax highlighting, mobile support, and more.
  * A highly customized Markdown implementation that goes above and beyond what Wikidot could support.
  * You can probably login on Chrome.

There is a lot of technical implementation details I could talk about, but that's for later. This project is a huge learning experience and I hope the work I have done here can be put to use.

If you wish to know more about me, or contact me, you can go to [my personal website.](www.monkasite.com) If you're simply just curious and wish to ask a few questions, my DMs on Discord are open. \[Monkatraz#7929\] 

If you want to work on Mainframe - especially if you're a part of the SCP wiki staff - get in touch on Discord. There would need to be a concerted effort to develop Mainframe into a proper replacement, and I can't do that alone.

### Some Shoutouts
This list is not inclusive. It is mostly for some people/projects that cannot be easily credited.
  * [Dimitar Donovski (u/ArduousIntent)](https://www.reddit.com/user/ArduousIntent) for their excellent SCP logo concept.
  * [grid-kiss](https://github.com/sylvainpolletvillard/postcss-grid-kiss): Converted into a Stylus plugin within the project.
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
  * Would there be separate language-based wikis? Mainframe supports multi-lingual pages natively, so this is not straightforward.
  * What inexpensive service could be used to store binary data?
    - S3 bucket?

----
## Basic Architecture
Mainframe is a static, single-page-application. Mainframe interacts with its remote database using only serverless functions and client-side API calls. This _the_ reason why Mainframe is cheap to run, as it basically _isn't_ whenever nobody is using it.

In order to actually be functional as a wiki, Mainframe makes heavy use of FaunaDB. FaunaDB itself is a document-based database. It is extremely well-suited for a wiki, although it doesn't do well with binary data. Mainframe is tightly integrated with FaunaDB, with the database API natively using FQL expressions and maximizing usage of FaunaDB's advanced features.

The integration between Mainframe and FaunaDB is to the point that it is near-certain that a guest will never need to invoke a serverless function. Nearly all interaction with the site can be expressed as direct client to database API interactions.

## Assets
Most of Mainframe's assets are either compiled or built. Mainframe is primarily written in:
  * TypeScript
  * Stylus
  * Svelte

Some JavaScript is used for development tools, like the Stylus Snowpack compiler, but the Mainframe codebase is written in TypeScript.

Most sources can be found in the `src` folder. Some additional assets can be found in the `public` folder - these assets have no build step and are just directly copied into the build target folder by Snowpack. Certain source files and development tools can be found within the `dev` folder.

## Used Runtime Libraries
Mainframe makes heavy runtime use of various JavaScript libraries - but these have all been chosen based on their minimal size and narrow scope. Mainframe does not use Vue, React, or any other runtime virtual DOM library, and instead uses Svelte. Svelte is a fundamental backbone for Mainframe's SPA design, and you need to know how to use Svelte if you contribute to Mainframe.

-----

## Development & Tools
Assets wise, Mainframe is really simple to build. Mainframe uses [Snowpack](www.snowpack.dev/) for both development and production asset building. The toolchain is very automatic and requires little knowledge of how it internally works.

### Dependencies
Mainframe has a fair number of dependencies. All of them can be found in the `package.json` and installed using NPM.

They are sorted like so:
  * `dependencies:` are for any runtime packages that the users will download and use.
  * `devDependencies:` are for any packages required to build the site, or for tools like `eslint`.

### Building Locally
Mainframe is very easy to build.

1. `git clone` this repository somewhere on your system. You can use GitHub desktop or IDE/editor plugins to easily
   clone this repo.
2. Open the local repository in a terminal and run `npm i`. This may take a while.
3. Once that is done, simply run the build script with `npm run build`. The entire website will be output to the newly
   created `build` folder once the build is complete.

### Running Locally
In order to function correctly, Mainframe needs to be connected to a FaunaDB database. It is not trivial to run one locally. As it stands, you'll be using the "production" database in development. This will change as soon as Mainframe progresses enough to get a "production" database.

Running the dev. server itself is incredibly simple. Just run `npm run dev` and let Snowpack start the dev. server. Once it has started, you will be able to connect to `localhost:8080`. The server will automatically reload on changes.

### Database Access
Currently, only I (monkatraz) have access to the FaunaDB database that Mainframe uses. This is subject to change.

## Contributing

\- todo: contributing -

## Deploying
Currently, Mainframe deploys whenever the `master` branch updates. Additionally, Vercel will build an instance of Mainframe with every pull request.

## License
MIT.