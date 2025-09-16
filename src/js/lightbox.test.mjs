/*
 * SPDX-License-Identifier: MIT
 * Modifications: © 2025 Michael Hughes
 *
 * @jest-environment: jsdom
 */
import { jest } from '@jest/globals';
import $ from 'jquery';
import lightbox from './lightbox.mjs';

describe('Lightbox', () => {
  it('should export an object', () => {
    expect(typeof lightbox).toBe('object');
    expect(lightbox).not.toBeNull();
  });

  describe('build', () => {
    it('should add lightbox HTML to the DOM', () => {
      expect($('#lightbox').length).toBe(0);
      expect($('#lightboxOverlay').length).toBe(0);

      lightbox.build();

      expect($('#lightbox').length).toBe(1);
      expect($('#lightboxOverlay').length).toBe(1);
    });

    it('should not add lightbox HTML to the DOM if it already exists', () => {
      lightbox.build();
      expect($('#lightbox').length).toBe(1);

      const appendToSpy = jest.spyOn($.fn, 'appendTo');

      lightbox.build();

      expect(appendToSpy).not.toHaveBeenCalled();

      // We should still only have one lightbox.
      expect($('#lightbox').length).toBe(1);

      appendToSpy.mockRestore();
    });
  });
});