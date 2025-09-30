/*
 * SPDX-License-Identifier: MIT
 * Copyright 2025 Michael Hughes
 *
 * @jest-environment: jsdom
 */
import { afterEach, beforeAll, beforeEach, describe, expect, jest } from '@jest/globals';
import $ from 'jquery';
import lightbox from './lightbox.mjs';
import ExifReader from 'exifreader';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const examplesDir = path.resolve(__dirname, '../../test-examples');
const withExifFile = path.join(examplesDir, 'ImgA.avif');
const withoutExifFile = path.join(examplesDir, 'ImgD.avif');

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
    let changeImageSpy ;
    beforeEach(() => {
      document.body.innerHTML
        = `<div> \ 
          <a href="image.jpg" data-lightbox="test-single" data-title="${title}"> \ 
            <img alt="${altCaption}" src="foo.jpg" /> \ 
          </a> \ 
        </div>`;
      lightbox.build();
      lightbox.enable();
      changeImageSpy = jest.spyOn(lightbox, 'changeImage').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call start when a lightbox link is clicked', () => {
      const link = $('a[data-lightbox]');

      link.trigger('click');

      expect(changeImageSpy).toHaveBeenCalled();
      expect(changeImageSpy).toHaveBeenCalledWith(0);
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

  describe('start', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      lightbox.album = [];
      lightbox.currentImageIndex = 0;
      document.body.innerHTML = '';
    });

    it('uses the anchor href target when building the album', () => {
      document.body.innerHTML
        = `<div> \
          <a href="full/image-a.jpg" data-lightbox="album"> \
            <img alt="Thumb A" src="thumb/thumb-a.jpg" /> \
          </a> \
          <a href="full/image-b.jpg" data-lightbox="album"> \
            <img alt="Thumb B" src="thumb/thumb-b.jpg" /> \
          </a> \
        </div>`;

      lightbox.build();

      const changeImageSpy = jest.spyOn(lightbox, 'changeImage').mockImplementation(() => {});
      const firstLink = $('a[data-lightbox]').first();

      lightbox.start(firstLink);

      expect(lightbox.album[0].link).toBe(firstLink[0].href);
      expect(lightbox.album[0].link).not.toBe(firstLink.find('img')[0].src);
      expect(lightbox.album).toHaveLength(2);
      expect(changeImageSpy).toHaveBeenCalledWith(0);
    });

    it('does not throw when the anchor lacks an image child', () => {
      document.body.innerHTML
        = `<div> \
          <a href="full/image-only.jpg" data-lightbox="solo">Open</a> \
        </div>`;

      lightbox.build();

      const changeImageSpy = jest.spyOn(lightbox, 'changeImage').mockImplementation(() => {});
      const link = $('a[data-lightbox]').first();

      expect(() => lightbox.start(link)).not.toThrow();
      expect(lightbox.album[0].link).toBe(link[0].href);
      expect(changeImageSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('multi-image album', () => {
    beforeEach(() => {
      document.body.innerHTML
        = `<div> \
          <a href="${withExifFile}" data-lightbox="multi-image" data-title="ImgA"> \ 
            <img alt="ImgA" src="${withExifFile}" /> \ 
          </a> \ 
          <a href="${withoutExifFile}" data-lightbox="multi-image" data-title="ImgD"> \ 
            <img alt="ImgD" src="${withoutExifFile}" /> \ 
          </a> \ 
        </div>`;
      lightbox.build();
      lightbox.enable();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create an album and call changeImage with the correct index', async () => {
      const changeImageSpy = jest.spyOn(lightbox, 'changeImage').mockImplementation(() => {});

      // Click the second image in the album
      const secondLink = $('a[data-lightbox]').eq(1);
      secondLink.trigger('click');

      expect(lightbox.album).toHaveLength(2);
      expect(changeImageSpy).toHaveBeenCalledWith(1);
    });

    it('should populate the album with correct data', async () => {
      jest.spyOn(lightbox, 'changeImage').mockImplementation(() => {});

      $('a[data-lightbox]').first().trigger('click');

      // Spot check
      const expectedFirstLink = new URL(withExifFile, window.location.href).href;
      const expectedSecondLink = new URL(withoutExifFile, window.location.href).href;

      expect(lightbox.album[0].link).toBe(expectedFirstLink);
      expect(lightbox.album[1].link).toBe(expectedSecondLink);
    });
  });

  describe('exif integration', () => {
    let expectedExifTags;

    function setupAlbumWithOverrides({
      src = 'examples/mock-image.avif',
      title = 'the default title'
    } = {}) {
      document.body.innerHTML
        = `<div> \ 
          <a href="${src}" data-lightbox="test-single-exif" data-title="${title}"> \ 
            <img alt="the alt" src="${src}" /> \ 
          </a> \ 
        </div>`;

      /*
        We still call #build #enable for click handler behavior, but we never call #start
        in these tests so we need to manually set lightbox's album to have appropriate data.
      */
      lightbox.build();
      lightbox.enable();
      lightbox.album = [
        {
          link: src,
          alt: 'the alt',
          title
        }
      ];
      lightbox.currentImageIndex = 0;
    };

    beforeAll(async () => {
      const buffer = await fs.readFile(withExifFile);
      expectedExifTags = await ExifReader.load(buffer);
    });

    afterEach(() => {
      jest.restoreAllMocks();
      lightbox.album = [];
      lightbox.currentImageIndex = 0;
    });

    it('applies EXIF metadata from examples/ImgA.avif when available', async () => {
      setupAlbumWithOverrides({ src: withExifFile });

      await lightbox.updateDetails();

      const updated = lightbox.album[0];
      expect(updated.title).toBe(expectedExifTags.title?.description);
      expect(updated.copyright).toBe(expectedExifTags.copyright?.description);
    });

    it('preserves existing metadata when EXIF data is absent', async () => {
      const newTitle = 'Album Provided Title';
      setupAlbumWithOverrides({
        src: withoutExifFile,
        title: newTitle
      });

      await lightbox.updateDetails();

      const updated = lightbox.album[0];
      expect(updated.copyright).toBeUndefined();
    });
  });
});
