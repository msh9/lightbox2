/*
 * SPDX-License-Identifier: MIT
 * Copyright 2025 Michael Hughes
 *
 * @jest-environment: jsdom
 */
import { beforeEach, describe, jest } from '@jest/globals';
import $ from 'jquery';
import lightbox from './lightbox.mjs';

describe('Lightbox', () => {
  it('should export an object', () => {
    expect(typeof lightbox).toBe('object');
    expect(lightbox).not.toBeNull();
  });

  describe('build', () => {
    it('should add lightbox HTML to the DOM', () => {
      expect($('#lightbox')).toHaveLength(0);
      expect($('#lightboxOverlay')).toHaveLength(0);

      lightbox.build();

      expect($('#lightbox')).toHaveLength(1);
      expect($('#lightboxOverlay')).toHaveLength(1);
    });

    it('should not add lightbox HTML to the DOM if it already exists', () => {
      lightbox.build();
      expect($('#lightbox')).toHaveLength(1);

      const appendToSpy = jest.spyOn($.fn, 'appendTo');

      lightbox.build();

      expect(appendToSpy).not.toHaveBeenCalled();

      // We should still only have one lightbox.
      expect($('#lightbox')).toHaveLength(1);

      appendToSpy.mockRestore();
    });
  });

  describe('single image handling', () => {
    const title = 'Single Title';
    const altCaption = 'Single Caption';
    beforeEach(() => {
      document.body.innerHTML
        = `<div> \ 
          <a href="image.jpg" data-lightbox="test-single" data-title="${title}"> \ 
            <img alt="${altCaption}" src="foo.jpg" /> \ 
          </a> \ 
        </div>`;
      lightbox.build();
      // We call enable() to ensure the click handler is attached.
      lightbox.enable();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call start when a lightbox link is clicked', () => {
      const startSpy = jest.spyOn(lightbox, 'start');
      const link = $('a[data-lightbox]');

      link.trigger('click');

      expect(startSpy).toHaveBeenCalledTimes(1);
      expect(startSpy.mock.calls[0][0][0]).toBe(link[0]);
    });

    it('should prevent default action and stop propagation', () => {
      jest.spyOn(lightbox, 'start').mockImplementation(() => {});
      const link = $('a[data-lightbox]');
      const event = new $.Event('click');

      link.trigger(event);

      expect(event.isDefaultPrevented()).toBe(true);
      expect(event.isPropagationStopped()).toBe(true);
    });
  });

  describe('multi-image album', () => {
    const title = 'Picture Title';
    const altCaption = 'Picture Caption';
    const baseFileName = 'image';
    beforeEach(() => {
      const albumLinks = [];
      for (let i = 0; i < 3; i++) {
        albumLinks.push(`<a href="${baseFileName}${i}.jpg" data-lightbox="test-album" data-title="${title}${i}"> \
            <img alt="${altCaption}${i}" src="${baseFileName}${i}.jpg" /> \
          </a>`);
      }

      document.body.innerHTML = `<div>${albumLinks.join('')}</div>`;
      lightbox.build();
      lightbox.enable();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create an album and call changeImage with the correct index', () => {
      const changeImageSpy = jest.spyOn(lightbox, 'changeImage').mockImplementation(() => {});

      // Click the second image in the album
      const secondLink = $('a[data-lightbox]').eq(1);
      secondLink.trigger('click');

      // Album should be created
      expect(lightbox.album).toHaveLength(3);

      // changeImage should be called with the index of the clicked image
      expect(changeImageSpy).toHaveBeenCalledWith(1);
    });

    it('should populate the album with correct data', () => {
      jest.spyOn(lightbox, 'changeImage').mockImplementation(() => {});

      // Click any link to trigger album creation
      $('a[data-lightbox]').first().trigger('click');

      for (let i = 0; i < 3; i++) {
        expect(lightbox.album[i].link).toBe(`${baseFileName}${i}.jpg`);
        expect(lightbox.album[i].title).toBe(`${title}${i}`);
      }
    });
  });

  describe.skip('exif data present', () => {
  });
});
