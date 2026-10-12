/*
 * SPDX-License-Identifier: MIT
 * Copyright 2026 Michael Hughes
 */
import { describe, expect, it, jest } from '@jest/globals';
import { handleKeyboard, nextIndex, previousIndex } from './actions.mjs';

describe('previousIndex', () => {
  it('steps back', () => {
    expect(previousIndex(2, 3, false)).toBe(1);
  });

  it('wraps to the end only when allowed', () => {
    expect(previousIndex(0, 3, true)).toBe(2);
    expect(previousIndex(0, 3, false)).toBeNull();
  });
});

describe('nextIndex', () => {
  it('steps forward', () => {
    expect(nextIndex(0, 3, false)).toBe(1);
  });

  it('wraps to the start only when allowed', () => {
    expect(nextIndex(2, 3, true)).toBe(0);
    expect(nextIndex(2, 3, false)).toBeNull();
  });
});

describe('handleKeyboard', () => {
  function fakeLightbox({ index = 0, length = 3, wrapAround = false } = {}) {
    return {
      album: new Array(length).fill({}),
      currentImageIndex: index,
      options: { wrapAround },
      changeImage: jest.fn(),
      end: jest.fn()
    };
  }

  function key(name) {
    return { key: name, stopPropagation: jest.fn() };
  }

  it('closes on Esc without letting the event bubble', () => {
    const lightbox = fakeLightbox();
    const event = key('Escape');

    handleKeyboard(lightbox, event);

    expect(lightbox.end).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('moves with the arrow keys', () => {
    const lightbox = fakeLightbox({ index: 1 });

    handleKeyboard(lightbox, key('ArrowLeft'));
    handleKeyboard(lightbox, key('ArrowRight'));

    expect(lightbox.changeImage.mock.calls).toEqual([[0], [2]]);
  });

  it('stops at the ends unless wrapAround is set', () => {
    const stopping = fakeLightbox({ index: 2 });
    handleKeyboard(stopping, key('ArrowRight'));
    expect(stopping.changeImage).not.toHaveBeenCalled();

    const wrapping = fakeLightbox({ index: 2, wrapAround: true });
    handleKeyboard(wrapping, key('ArrowRight'));
    expect(wrapping.changeImage).toHaveBeenCalledWith(0);
  });

  it('does not wrap a single-image album', () => {
    const lightbox = fakeLightbox({ length: 1, wrapAround: true });

    handleKeyboard(lightbox, key('ArrowLeft'));

    expect(lightbox.changeImage).not.toHaveBeenCalled();
  });
});
