# Contributing to Flogo
First of all, thanks for being interested in Flogo.

Everyone is welcome to contribute using GitHub:
* Code contributions: Send a PR. Any contribution you make will be listed in the credits section in README.md. The only requirement is that no proprietary software or dependencies on external services are added; Flogo is an offline-first application.
* Bug reports: Found a bug? A typo? Open an issue
* Feature requests and other feedback: Open an issue or [send an email](mailto:info@fdossena.com)

Always be respectful of the developers and other users, no one is getting paid for working on this.

## Project structure
Flogo is a typical npm+vite project and has two main versions: webapp (PWA) and Electron.

Some common libraries and tools were used in its creation:
* [Konva](https://konvajs.org/): Object-oriented JS canvas library (MIT License)
* [jsep](https://ericsmekens.github.io/jsep/): JS expression parser (MIT License)
* [SVGCanvas](https://zenozeng.github.io/svgcanvas/): SVG export library for JS canvas (MIT License)
* [Vite PWA](https://github.com/vite-pwa/vite-plugin-pwa): Automatic creation of PWA manifest and service worker (MIT License)
* [Electron](https://www.electronjs.org/): For the desktop versions (MIT License)

The files in the repository are organized in this way:
```
 /
 ├── package.json, package-lock.json, vite.config.js: npm and vite files
 ├── index.html: the "skeleton" for Flogo, contains all static UI elements and 
 |               placeholders for the dynamically generated parts; also contains
 |               the loading spinner animation
 ├── src: all JS and CSS code for the modules that make up Flogo
 │   ├── flogo-language.js: language interpreter and functions for saving/loading programs
 │   ├── platformSpecific.js: utilities for platform detection and settings storage for PWA/Electron
 │   ├── ui-*: UI components
 │   ├── global.css: common CSS rules used by all components
 │   └── app.js, style.css: load all other files in the correct order
 ├── public: static assets like the logo, themes, etc.
 └── electron: files used only by the Electron version
```

### Downloading the repository
To download the repository and all the required libraries, use these commands:
```bash
git clone https://github.com/adolfintel/flogo
cd flogo
npm install
```

If you plan on making modifications to Flogo, you should fork the project and clone your fork instead of the main repo.

### Testing the app
To test the webapp locally, use this command:
```bash
npm run dev
```

To test the Electron version, use this command:
```bash
npm run electron:dev
```

Note: a few other folders will be created: `dist`, `dist-electron`, `release`. These folders will be ignored when committing to the repo.

### Building the app
See `BUILDING.md`.
