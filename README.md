# Lightbox

A zero-production-dependency HTML attribute driven modal lightbox. Originally based on Lightbox2 by [Lokesh Dhakar](https://github.com/lokesh/lightbox2), now with many, many changes.

Key features,

- Title, caption, and copyright are read from data attributes (see below) and always rendered as plain text. 
- No jQuery or other runtime dependencies
- Renders images with the HTML picture tag to provide client aware alternative image formats.
- The lightbox is a native modal `<dialog>`, which provides the backdrop, focus handling, closing on Escape, and keeps the page from scrolling behind it. Fades and resizing are CSS transitions.

## Setup

Include the stylesheet and the script, then call `init()` once:

```html
<link rel="stylesheet" href="dist/css/lightbox.min.css">
<script src="dist/js/lightbox.min.js"></script>
<script>lightbox.init();</script>
```

Or, as a module:

```html
<script type="module">
import lightbox from './dist/js/lightbox.module.js';

lightbox.init({ wrapAround: true });
</script>
```

`init()` accepts the same options as `lightbox.option()` and can be called before the document has finished loading.

The stylesheet expects the images from `dist/images/` at `../images/` relative to itself.

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

If the `href` has no recognizable extension (for example an image served from a query-string URL), or you want to state the type explicitly, add `data-lb-typehint-fallback` with the MIME type of the `href` image, e.g. `data-lb-typehint-fallback="image/avif"`. The hint takes precedence over the extension.

`data-lb-width` and `data-lb-height` are optional. When both are present they are used instead of the loaded image's intrinsic size.

Every metadata attribute is optional and missing fields are hidden. When `data-lb-alt` is absent, the thumbnail's `alt` is used. The title labels the lightbox dialog, and the caption and copyright describe the image for assistive technology.

When both dimensions are given the lightbox resizes to them while the image is still loading, instead of waiting to measure it.

## Options

```js
lightbox.option({
  albumLabel: 'Image %1 of %2', // %1 is the current image number, %2 the album size
  showImageNumberLabel: true,
  wrapAround: false // whether navigation continues from the last image to the first and back
});
```

## Styling

Timings and the backdrop color are CSS custom properties on `.lightbox`. They drop to `0s` when the visitor prefers reduced motion.

```css
.lightbox {
  --lb-fade-duration: 0.6s;       /* opening and closing */
  --lb-image-fade-duration: 0.6s; /* each image and its details */
  --lb-resize-duration: 0.7s;     /* resizing between images */
  --lb-backdrop-color: rgb(0 0 0 / 80%);
}
```

Fades on opening and closing use `@starting-style` and `transition-behavior: allow-discrete`; browsers without them open and close instantly.

## Local development

- Install dependencies: `npm i`
- Build or watch and rebuild files: `npm run build` or `npm run watch`
- Start local server: `npm start`
- Navigate to `localhost:8080/test-examples`
- `test-examples/index.html` loads the built bundle from `dist/`, so keep `npm run watch` running while editing.

