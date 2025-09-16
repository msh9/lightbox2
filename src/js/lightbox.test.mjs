/*
 * SPDX-License-Identifier: MIT
 * Modifications: © 2025 Michael Hughes
 *
 */
import lightbox from './lightbox.mjs';

describe('Lightbox', () => {
  it('should export an object', () => {
    expect(typeof lightbox).toBe('object');
    expect(lightbox).not.toBeNull();
  });
});
