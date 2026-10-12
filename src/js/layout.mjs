/*
 * SPDX-License-Identifier: MIT
 * Original work: © 2015-2025 Lokesh Dhakar
 * Modifications: © 2025-2026 Michael Hughes
 *
 */

// The largest image that fits in the viewport, leaving room for the container padding, the image
// border, a 10px gutter on each side, a margin above, and the details bar below.
export function maxImageSize(viewport, padding, border, marginTop) {
  return {
    width: viewport.width - padding.left - padding.right - border.left - border.right - 20,
    height: viewport.height - padding.top - padding.bottom - border.top - border.bottom - marginTop - 70
  };
}

// Size an image for display within max, preserving its aspect ratio. Images are only ever scaled
// down, except SVGs.
export function fitImage(natural, max, isSvg) {
  const maxWidth = max.width;
  const maxHeight = max.height;

  /*
    Since many SVGs have small intrinsic dimensions, but they support scaling
    up without quality loss because of their vector format, max out their
    size inside the viewport.
    */
  if (isSvg) {
    const scale = Math.min(maxWidth / natural.width, maxHeight / natural.height);
    return { width: parseInt(natural.width * scale, 10), height: parseInt(natural.height * scale, 10) };
  }

  // Is the current image's width or height is greater than the maxWidth or maxHeight
  // option than we need to size down while maintaining the aspect ratio.
  if ((natural.width > maxWidth) || (natural.height > maxHeight)) {
    if ((natural.width / maxWidth) > (natural.height / maxHeight)) {
      return { width: maxWidth, height: parseInt(natural.height / (natural.width / maxWidth), 10) };
    }
    return { width: parseInt(natural.width / (natural.height / maxHeight), 10), height: maxHeight };
  }

  return { width: natural.width, height: natural.height };
}
