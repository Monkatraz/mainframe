# Mainframe
## An unofficial proof-of-concept for the [SCP-Wiki](http://www.scpwiki.com).

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

## License
MIT.