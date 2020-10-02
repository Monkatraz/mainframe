# Mainframe
## An unofficial proof-of-concept for the [SCP-Wiki](www.scpwiki.com).

[![Netlify Status](https://api.netlify.com/api/v1/badges/78e6519c-b9ab-440a-9a77-ef79694eac65/deploy-status)](https://app.netlify.com/sites/scp-mainframe/deploys)

Mainframe is a personal attempt to create an affordable, modern replacement for the SCP-Wiki website.

Right off the bat, Mainframe is:
  * A _clean slate_. No considerations for legacy content were considered.
  * A modern site, using modern features. There is no IE11 support and there never will be.
  * An upgrade. Mainframe has a lot of things going for it compared to the old wiki. It's almost hard to call it a wiki
    \- it's entirely geared for just displaying pages and handling users.
  * Really accessible. A lot of work was put into a11y - although there is some limitations. (Must have JS, and unfortunately no Opera Mini support)
  * Finally, and absolutely most importantly: _cheap as hell._ Mainframe attempts to do literally everything as cheaply as
    possible. A SCP Wiki replacement has to support at least 10,000 active users.

There is a lot of technical implementation details I could talk about, but that's for later. This project is a huge
learning experience and I hope the work I have done here can be put to use.

If you wish to know more about me, or contact me, you can go to [my personal website.](www.monkasite.com)
If you're simply just curious and wish to ask a few questions, my DMs on Discord are open. \[Monkatraz#7929\]

----

## Basic Architecture
Mainframe is a static, single-page-application. Mainframe interacts with its remote database using only serverless
functions and client-side API calls. This is part of the reason why Mainframe is cheap to run, as it basically isn't
running whenever someone isn't using it.

## Assets
Most of Mainframe's assets are either compiled or built. Mainframe is primarily written in:
  * TypeScript
  * Pug
  * Stylus + PostCSS

Additionally, Svelte is used to generate UI components.

All sources can be found in the `src` folder. Additional assets will be found in the `public` folder - these assets have
no build step and are just directly copied into the build target folder.

## Development & Tools
Assets wise, Mainframe is really simple to build. Mainframe uses [Snowpack](www.snowpack.dev/) for both development and
production asset building. The toolchain is very automatic and requires little knowledge of how it internally works.

However, actually hosting the site can be a challenge. Mainframe is tightly bound to both [Netlify](www.netlify.com) and
[FaunaDB](www.fauna.com) - attempting to host using other services will require a lot of work.

### Building Locally
Mainframe is very easy to build.

1. `git clone` this repository somewhere on your system. You can use GitHub desktop or IDE/editor plugins to easily
   clone this repo.
2. Open the local repository in a terminal and run `npm i`. This will install the fair number of dependencies that
   you'll need to build the site.
3. Once that is done, simply run the build script with `npm run build`. The entire website will be output to the newly
   created `build` folder once the build is complete.

### Running Locally
Running locally is slightly more complex. In order to function correctly, Mainframe needs to be connected to a FaunaDB
database. It is difficult to run one locally. 

\- todo: dev/run -

## Contributing

\- todo: contributing -

## Deploying
As Mainframe is hosted on Netlify, any changes made to the `master` branch in this repository will automatically cause
the site to be deployed.

## License
MIT.