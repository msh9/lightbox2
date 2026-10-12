/*
 * SPDX-License-Identifier: MIT
 * Copyright 2026 Michael Hughes
 */
import { describe, expect, it } from '@jest/globals';
import { fitImage, maxImageSize } from './layout.mjs';

describe('maxImageSize', () => {
  it('subtracts padding, border, gutters, and the top margin', () => {
    const padding = { top: 4, right: 4, bottom: 4, left: 4 };
    const border = { top: 4, right: 4, bottom: 4, left: 4 };

    expect(maxImageSize({ width: 1000, height: 800 }, padding, border, 50))
      .toEqual({ width: 1000 - 16 - 20, height: 800 - 16 - 50 - 70 });
  });
});

describe('fitImage', () => {
  it('leaves images that already fit at their natural size', () => {
    expect(fitImage({ width: 400, height: 300 }, { width: 800, height: 600 }, false))
      .toEqual({ width: 400, height: 300 });
  });

  it('scales wide images down to the max width', () => {
    expect(fitImage({ width: 1600, height: 800 }, { width: 800, height: 600 }, false))
      .toEqual({ width: 800, height: 400 });
  });

  it('scales tall images down to the max height', () => {
    expect(fitImage({ width: 600, height: 1200 }, { width: 800, height: 600 }, false))
      .toEqual({ width: 300, height: 600 });
  });

  it('scales SVGs up to fill the available space', () => {
    expect(fitImage({ width: 100, height: 50 }, { width: 800, height: 600 }, true))
      .toEqual({ width: 800, height: 400 });
    expect(fitImage({ width: 50, height: 100 }, { width: 800, height: 600 }, true))
      .toEqual({ width: 300, height: 600 });
  });

  it('keeps SVGs within both dimensions', () => {
    expect(fitImage({ width: 300, height: 100 }, { width: 800, height: 200 }, true))
      .toEqual({ width: 600, height: 200 });
  });
});
