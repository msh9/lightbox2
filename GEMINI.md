# Project: Lightbox2

## Project Overview

This project is a fork of Lightbox2, a popular and original JavaScript library for creating image overlays. It is a small, dependency-free (besides jQuery) library that works on all modern browsers. The library is written in vanilla JavaScript for browsers. This project aims to improve upon the original Lightbox2 by updating build toolchain (already done), adding tests, refactoring, and finally adding new functionality.

Currently, main functionality is contained in `src/js/lightbox.js`. The styling is in `src/css/lightbox.css`. The library is initialized by adding the `data-lightbox` attribute to an anchor tag wrapping an image.

## Building and Running

The project uses npm scripts for linting, testing, and distribution builds. Dependencies are managed with NPM.

### Dependencies

**Node.js**: Required build and test.
**See `package.json`** for other dependencies.

### Installation

1.  Clone the repository.
2.  Install dependencies: `npm install`

### Key Commands

-   **`npm start`**: Starts a local development server at `http://localhost:8080`. The main example page is at `http://localhost:8000/examples/index.html`.
-   **`npm run lint`**: Lints the JavaScript and CSS files
-   **`npm run build`**: Creates a production-ready `dist` directory. Uses cssnano and rollup, see rollup's config in `rollup.config.js`

## Development Conventions

-   **Code Style**: The project uses eslint & prettier for JS and stylelint for CSS. See `.editorconfig`, `.eslint.config.mjs`, and `.stylelintrc.json` for rules.
