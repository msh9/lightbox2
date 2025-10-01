# Lightbox2 with a little exif

Fork of Lightbox2 originally by [Lokesh Dhakar](https://github.com/lokesh/lightbox2)

This fork does three things,

- Adds a dependency on exifreader which is used to display copyright and ttile information from image tags (when present)
- A (arguably) backwards incompatible change that switches the default sanitization option for titles to 'on' instead of off. Specifically, the `sanitize` option now defaults to true instead of false.
- Updates the build toolchain with more recent tools, tests, and linters. 

This library should still be useful for anyone who would like to use it for their own photogallery and is a mostly drop-in replacement for the original lightbox library. That said, I added the exifreader dependency for my own uses at [photos.michaelonrandom.com](https://photos.michaelonrandom.com) and do not expect to continue with more development on this library at this time.

## Local development

- Install dependencies: `npm i`
- Build or watch and rebuild files: `npm build` or `npm run watch`
- Start local server: `npm start`
- Navigate to `localhost:8080/test-examples`
- Update `examples/index.html` to load jQuery and `src/js/lightbox.js`.

