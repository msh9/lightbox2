# Project: Lightbox2

## Project Overview

This project is the source code for Lightbox2, a popular and original JavaScript library for creating image overlays. It is a small, dependency-free (besides jQuery) library that works on all modern browsers. The library is written in JavaScript and uses Grunt as a build tool.

The main functionality is contained in `src/js/lightbox.js`. The styling is in `src/css/lightbox.css`. The library is initialized by adding the `data-lightbox` attribute to an anchor tag wrapping an image.

## Building and Running

The project uses Grunt for its build process and Bower for managing the jQuery dependency. Grunt and Bower are installed as local dev dependencies.

### Dependencies

- **Node.js**: Required for running Grunt and Bower.

### Installation

1.  Clone the repository.
2.  Install dependencies: `npm install` (this will also run `bower install` automatically).

### Key Commands

-   **`npm start`**: Starts a local development server at `http://localhost:8000` and watches for file changes. The main example page is at `http://localhost:8000/examples/index.html`.
-   **`npm test`**: Lints the JavaScript files using JSHint and JSCS.
-   **`npm run build`**: Creates a production-ready `dist` directory. This includes:
    -   Copying all files from `src` to `dist`.
    -   Concatenating `lightbox.js` with jQuery into `dist/js/lightbox-plus-jquery.js`.
    -   Minifying `lightbox.js` and `lightbox-plus-jquery.js`.
    -   Minifying `lightbox.css`.

## Development Conventions

-   **Code Style**: The project uses JSHint and JSCS for code linting. The configuration can be found in `.jshintrc` and `.jscsrc`. The style is 2-space indentation, camelCase, and single quotes.
-   **Dependencies**: The project uses Bower to manage the jQuery dependency.
-   **Build System**: The project uses Grunt for task automation. The build tasks are defined in `Gruntfile.js`.
-   **Contributions**: The `README.md` file mentions a `DEPLOY.md` file for release instructions and a `ROADMAP.md` for future plans. Pull requests and issues are managed on GitHub.
