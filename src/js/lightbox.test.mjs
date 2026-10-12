/*
 * SPDX-License-Identifier: MIT
 * Copyright 2025 Michael Hughes
 *
 * @jest-environment: jsdom
 */
import { afterEach, beforeEach, describe, expect, jest } from '@jest/globals';
import $ from 'jquery';
import lightbox from './lightbox.mjs';

const firstFile = 'test-examples/ImgA.avif';
const secondFile = 'test-examples/ImgD.avif';

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
        = '<div> \
          <a href="full/image-a.jpg" data-lightbox="album"> \
            <img alt="Thumb A" src="thumb/thumb-a.jpg" /> \
          </a> \
          <a href="full/image-b.jpg" data-lightbox="album"> \
            <img alt="Thumb B" src="thumb/thumb-b.jpg" /> \
          </a> \
        </div>';

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
        = '<div> \
          <a href="full/image-only.jpg" data-lightbox="solo">Open</a> \
        </div>';

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
          <a href="${firstFile}" data-lightbox="multi-image" data-title="ImgA"> \ 
            <img alt="ImgA" src="${firstFile}" /> \ 
          </a> \ 
          <a href="${secondFile}" data-lightbox="multi-image" data-title="ImgD"> \ 
            <img alt="ImgD" src="${secondFile}" /> \ 
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
      const expectedFirstLink = new URL(firstFile, window.location.href).href;
      const expectedSecondLink = new URL(secondFile, window.location.href).href;

      expect(lightbox.album[0].link).toBe(expectedFirstLink);
      expect(lightbox.album[1].link).toBe(expectedSecondLink);
    });
  });

  describe('metadata attributes', () => {
    function startWith(attributes, thumbnailAlt = 'Thumb alt') {
      document.body.innerHTML
        = `<a href="full.jpg" data-lightbox="meta" ${attributes}><img alt="${thumbnailAlt}" src="thumb.jpg" /></a>`;
      lightbox.build();
      jest.spyOn(lightbox, 'changeImage').mockImplementation(() => {});
      lightbox.start($('a[data-lightbox]'));
      lightbox.currentImageIndex = 0;
    }

    afterEach(() => {
      jest.restoreAllMocks();
      lightbox.album = [];
      lightbox.currentImageIndex = 0;
      document.body.innerHTML = '';
    });

    it('reads title, caption, copyright and alt from data attributes', () => {
      startWith('data-title="T" data-caption="C" data-copyright="© Me" data-alt="A"');

      expect(lightbox.album[0]).toMatchObject({
        title: 'T',
        caption: 'C',
        copyright: '© Me',
        alt: 'A'
      });
    });

    it('falls back to the thumbnail alt when data-alt is absent', () => {
      startWith('', 'From thumbnail');

      expect(lightbox.album[0].alt).toBe('From thumbnail');
    });

    it('honors an explicitly empty data-alt', () => {
      startWith('data-alt=""', 'From thumbnail');

      expect(lightbox.album[0].alt).toBe('');
    });

    it('renders every field and wires up aria references', () => {
      startWith('data-title="T" data-caption="C" data-copyright="© Me"');

      lightbox.updateDetails();

      expect($('.lb-title').text()).toBe('T');
      expect($('.lb-caption').text()).toBe('C');
      expect($('.lb-copyright').text()).toBe('© Me');
      expect($('#lightbox').attr('aria-labelledby')).toBe('lb-title');
      expect($('.lb-image').attr('aria-describedby')).toBe('lb-caption lb-copyright');
    });

    it('hides missing fields and drops their aria references', () => {
      startWith('data-caption="Only a caption"');

      lightbox.updateDetails();

      expect($('.lb-title').css('display')).toBe('none');
      expect($('.lb-copyright').css('display')).toBe('none');
      expect($('.lb-caption').text()).toBe('Only a caption');
      expect($('#lightbox').attr('aria-labelledby')).toBeUndefined();
      expect($('.lb-image').attr('aria-describedby')).toBe('lb-caption');
    });

    it('renders markup in metadata as plain text', () => {
      startWith('data-title="&lt;b&gt;bold&lt;/b&gt;"');

      lightbox.updateDetails();

      expect($('.lb-title').text()).toBe('<b>bold</b>');
      expect($('.lb-title').find('b')).toHaveLength(0);
    });
  });
});
