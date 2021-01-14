
# Contributions are very appreciated!

Currently, Mainframe is in a heavily incomplete state and needs a lot of development work to be production-ready. Any contribution that you can make to progress this further would be very much welcome!

If you have skill / experience with web development and want to help, but don't know where to start, please get in touch with me on Discord \[Monkatraz#7929\].

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

1. `git clone` this repository somewhere on your system. You can use GitHub desktop or IDE/editor plugins to easily clone this repo.
2. Open the local repository in a terminal and run `npm i`. This may take a while.
3. Once that is done, simply run the build script with `npm run build`. The entire website will be output to the newly created `build` folder once the build is complete.

### Running Locally
In order to function correctly, Mainframe needs to be connected to a FaunaDB database. It is not trivial to run one locally. As it stands, you'll be using the "production" database in development. This will change as soon as Mainframe progresses enough to get a "production" database.

Running the dev. server itself is incredibly simple. Just run `npm run dev` and let Snowpack start the dev. server. Once it has started, you will be able to connect to `localhost:8080`. The server will automatically reload on changes.

### Database Access
Currently, only I (monkatraz) have access to the FaunaDB database that Mainframe uses. This is subject to change.

## Pull Requests

\- todo: contributing -

## Deploying
Currently, Mainframe deploys whenever the `master` branch updates. Additionally, Vercel will build an instance of Mainframe with every pull request.