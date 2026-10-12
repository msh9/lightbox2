/*
 * SPDX-License-Identifier: MIT
 * Copyright 2026 Michael Hughes
 */
const MIME_TYPES = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  jxl: 'image/jxl',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp'
};

// Guess an image MIME type from a URL's file extension. Browsers skip a <source> whose type they
// cannot decode, which is what lets the fallback <img> take over.
export function mimeTypeFor(url) {
  const extension = new URL(url).pathname.split('.').pop().toLowerCase();
  return MIME_TYPES[extension];
}

// Point a <picture>'s <source> and <img> at an album entry. Without a fallback the <source> is
// cleared so the <img> loads the link directly. A type hint from the page wins over guessing.
export function setPictureSources(source, img, image) {
  if (image.fallback) {
    const type = image.typeHint || mimeTypeFor(image.link);
    source.srcset = image.link;
    if (type) {
      source.type = type;
    } else {
      source.removeAttribute('type');
    }
    img.src = image.fallback;
  } else {
    source.removeAttribute('srcset');
    source.removeAttribute('type');
    img.src = image.link;
  }
}

// Load an album entry through a detached <picture> so the browser picks, and caches, the same
// candidate the lightbox will display.
export function loadPicture(image) {
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  const img = document.createElement('img');
  picture.append(source, img);
  setPictureSources(source, img, image);
  return img;
}
