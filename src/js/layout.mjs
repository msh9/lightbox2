/*
 * SPDX-License-Identifier: MIT
 * Original work: © 2015-2025 Lokesh Dhakar
 * Modifications: © 2025-2026 Michael Hughes
 *
 */

// The largest image that fits in the viewport, leaving room for the container padding, the image
// border, a 10px gutter on each side, the offset from the top, and the details bar below.
export function maxImageSize(viewport, padding, border, positionFromTop) {
  return {
    width: viewport.width - padding.left - padding.right - border.left - border.right - 20,
    height: viewport.height - padding.top - padding.bottom - border.top - border.bottom - positionFromTop - 70
  };
}

// Size an image for display within max, preserving its aspect ratio.
export function fitImage(natural, max, isSvg, options) {
  let maxWidth = max.width;
  let maxHeight = max.height;

  /*
    Since many SVGs have small intrinsic dimensions, but they support scaling
    up without quality loss because of their vector format, max out their
    size inside the viewport.
    */
  if (isSvg) {
    const aspectRatio = natural.width / natural.height;
    if (aspectRatio >= 1) {
      return { width: maxWidth, height: parseInt(maxWidth / aspectRatio, 10) };
    }
    return { width: parseInt(maxHeight / aspectRatio, 10), height: maxHeight };
  }

  // Fit image inside the viewport.
  if (options.fitImagesInViewport) {
    // Check if image size is larger then maxWidth|maxHeight in settings
    if (options.maxWidth && options.maxWidth < maxWidth) {
      maxWidth = options.maxWidth;
    }
    if (options.maxHeight && options.maxHeight < maxHeight) {
      maxHeight = options.maxHeight;
    }
  } else {
    maxWidth = options.maxWidth || natural.width || maxWidth;
    maxHeight = options.maxHeight || natural.height || maxHeight;
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
