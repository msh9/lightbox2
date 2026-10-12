/*
 * SPDX-License-Identifier: MIT
 * Copyright 2026 Michael Hughes
 */
import { describe, expect, it } from '@jest/globals';
import { loadPicture, mimeTypeFor } from './picture.mjs';

describe('mimeTypeFor', () => {
  it('maps known extensions regardless of case', () => {
    expect(mimeTypeFor('https://example.com/a.avif')).toBe('image/avif');
    expect(mimeTypeFor('https://example.com/a.JPG')).toBe('image/jpeg');
  });

  it('ignores query strings and fragments', () => {
    expect(mimeTypeFor('https://example.com/a.webp?v=2#top')).toBe('image/webp');
  });

  it('returns undefined for unknown or missing extensions', () => {
    expect(mimeTypeFor('https://example.com/a.bmp')).toBeUndefined();
    expect(mimeTypeFor('https://example.com/image')).toBeUndefined();
  });
});

describe('loadPicture', () => {
  it('builds a detached picture with the source before the img', () => {
    const img = loadPicture({
      link: 'https://example.com/a.avif',
      fallback: 'https://example.com/a.jpg'
    });
    const picture = img.parentElement;

    expect(picture.tagName).toBe('PICTURE');
    expect(picture.isConnected).toBe(false);
    expect(picture.firstElementChild.tagName).toBe('SOURCE');
    expect(picture.firstElementChild.getAttribute('type')).toBe('image/avif');
    expect(img.src).toBe('https://example.com/a.jpg');
  });
});
