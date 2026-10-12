# Lightbox

Fork of Lightbox2 originally by [Lokesh Dhakar](https://github.com/lokesh/lightbox2)

This fork differs from the original in a few ways:

- Title, caption, and copyright are read from data attributes (see below) and always rendered as plain text. The `sanitizeTitle` option has been removed.
- Updates the build toolchain with more recent tools, tests, and linters.

## Usage

Wrap a thumbnail in a link to the full-size image. Links that share a `data-lightbox` value form an album.

```html
<a href="full.jpg"
   data-lightbox="album-name"
   data-lb-title="Title"
   data-lb-caption="Caption"
   data-lb-copyright="© Photographer"
   data-lb-alt="Description of the full-size image">
  <img src="thumb.jpg" alt="Thumbnail description">
</a>
```

To serve a modern format with a fallback, point `href` at the preferred image and `data-lb-href-fallback` at an alternative with the same dimensions. The lightbox renders a `<picture>` whose `<source>` type is inferred from the `href` file extension, so browsers that cannot decode it load the fallback instead.

```html
<a href="full.avif" data-lb-href-fallback="full.jpg" data-lb-width="1600" data-lb-height="1067" data-lightbox="album-name">
  <img src="thumb.jpg" alt="Thumbnail description">
</a>
```

`data-lb-width` and `data-lb-height` are optional. When both are present they are used instead of the loaded image's intrinsic size.

Every metadata attribute is optional and missing fields are hidden. When `data-lb-alt` is absent, the thumbnail's `alt` is used. The title labels the lightbox dialog, and the caption and copyright describe the image for assistive technology.

## Local development

- Install dependencies: `npm i`
- Build or watch and rebuild files: `npm run build` or `npm run watch`
- Start local server: `npm start`
- Navigate to `localhost:8080/test-examples`
- `test-examples/index.html` loads the built bundle from `dist/`, so keep `npm run watch` running while editing.

