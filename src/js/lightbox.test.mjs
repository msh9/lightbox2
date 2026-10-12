/*
 * SPDX-License-Identifier: MIT
 * Copyright 2025-2026 Michael Hughes
 *
 * @jest-environment: jsdom
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import lightbox from './lightbox.mjs';

/*
  These tests drive the lightbox through the DOM, the way a page and its visitors would, so that
  they keep holding while the implementation moves off jQuery. Page links live in a fixture
  element; the lightbox's own markup is appended to <body> and persists between tests.
*/
let fixture;

// jsdom has no <dialog> methods and no img.decode(); stand in with the behavior the lightbox uses.
HTMLDialogElement.prototype.showModal ??= function() {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function() {
  if (this.open) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  }
};
HTMLImageElement.prototype.decode ??= function() {
  return Promise.resolve();
};

function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function render(html) {
  fixture.innerHTML = html;
}

function links() {
  return [...fixture.querySelectorAll('a[data-lightbox]')];
}

function $q(selector) {
  return document.querySelector(selector);
}

function click(element) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
}

function keyup(element, key) {
  const event = new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
}

function isHidden(element) {
  return getComputedStyle(element).display === 'none';
}

beforeAll(() => {
  lightbox.init();

  fixture = document.createElement('div');
  document.body.append(fixture);
});

let changeImageSpy;

beforeEach(() => {
  // Image loading never completes in jsdom, so stop at changeImage and only record the position.
  changeImageSpy = jest.spyOn(lightbox, 'changeImage').mockImplementation(function(index) {
    this.currentImageIndex = index;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  lightbox.end();
  fixture.innerHTML = '';
  lightbox.album = [];
  lightbox.currentImageIndex = 0;
});

describe('setup', () => {
  it('exports an object', () => {
    expect(typeof lightbox).toBe('object');
    expect(lightbox).not.toBeNull();
  });

  it('adds the lightbox dialog to the page exactly once', () => {
    lightbox.init();
    lightbox.build();

    expect(document.querySelectorAll('#lightbox')).toHaveLength(1);
    expect($q('#lightbox').tagName).toBe('DIALOG');
  });

  it('starts closed', () => {
    expect($q('#lightbox').open).toBe(false);
  });
});

describe('opening', () => {
  it('opens at the clicked link', () => {
    render('<a href="image.jpg" data-lightbox="single"><img alt="Thumb" src="thumb.jpg" /></a>');

    const showModal = jest.spyOn($q('#lightbox'), 'showModal');

    click(links()[0]);

    expect(showModal).toHaveBeenCalled();
    expect($q('#lightbox').open).toBe(true);
    expect(changeImageSpy).toHaveBeenCalledTimes(1);
    expect(changeImageSpy).toHaveBeenCalledWith(0);
  });

  it('prevents navigation and stops the click from propagating', () => {
    render('<a href="image.jpg" data-lightbox="single"><img alt="Thumb" src="thumb.jpg" /></a>');
    const documentListener = jest.fn();
    document.addEventListener('click', documentListener);

    const event = click(links()[0]);

    expect(event.defaultPrevented).toBe(true);
    expect(documentListener).not.toHaveBeenCalled();
    document.removeEventListener('click', documentListener);
  });

  it('opens when a child of the link, such as the thumbnail, is clicked', () => {
    render('<a href="image.jpg" data-lightbox="single"><img alt="Thumb" src="thumb.jpg" /></a>');

    click(fixture.querySelector('img'));

    expect(changeImageSpy).toHaveBeenCalledWith(0);
  });

  it('ignores links without data-lightbox', () => {
    render('<a href="image.jpg"><img alt="Thumb" src="thumb.jpg" /></a>');

    click(fixture.querySelector('a'));

    expect(changeImageSpy).not.toHaveBeenCalled();
  });

  it('ignores image map areas', () => {
    render('<map name="m"><area href="image.jpg" data-lightbox="map" alt="Area"></map>');

    click(fixture.querySelector('area'));

    expect(changeImageSpy).not.toHaveBeenCalled();
  });

  it('works for links without an image child', () => {
    render('<a href="full/image-only.jpg" data-lightbox="solo">Open</a>');

    click(links()[0]);

    expect(lightbox.album[0].link).toBe(links()[0].href);
    expect(changeImageSpy).toHaveBeenCalledWith(0);
  });
});

describe('albums', () => {
  beforeEach(() => {
    render(`
      <a href="full/a.jpg" data-lightbox="set"><img alt="A" src="thumb/a.jpg" /></a>
      <a href="full/other.jpg" data-lightbox="other"><img alt="Other" src="thumb/other.jpg" /></a>
      <a href="full/b.jpg" data-lightbox="set"><img alt="B" src="thumb/b.jpg" /></a>
      <a href="full/c.jpg" data-lightbox="set"><img alt="C" src="thumb/c.jpg" /></a>
    `);
  });

  it('groups links sharing a data-lightbox value, in document order', () => {
    click(links()[0]);

    expect(lightbox.album.map((image) => image.link)).toEqual([
      new URL('full/a.jpg', document.baseURI).href,
      new URL('full/b.jpg', document.baseURI).href,
      new URL('full/c.jpg', document.baseURI).href
    ]);
  });

  it('uses the full-size href rather than the thumbnail', () => {
    click(links()[0]);

    expect(lightbox.album[0].link).toBe(links()[0].href);
    expect(lightbox.album[0].link).not.toBe(links()[0].querySelector('img').src);
  });

  it('handles album names containing quotes and backslashes', () => {
    render(`
      <a href="full/x.jpg" data-lightbox='say "hi" \\o/'>X</a>
      <a href="full/y.jpg" data-lightbox='say "hi" \\o/'>Y</a>
    `);

    click(links()[1]);

    expect(lightbox.album).toHaveLength(2);
    expect(changeImageSpy).toHaveBeenCalledWith(1);
  });

  it('opens at the clicked link\'s position in its album', () => {
    click(links()[2]);

    expect(lightbox.album).toHaveLength(3);
    expect(changeImageSpy).toHaveBeenCalledWith(1);
  });
});

describe('controls', () => {
  let endSpy;

  beforeEach(() => {
    render(`
      <a href="a.jpg" data-lightbox="set">A</a>
      <a href="b.jpg" data-lightbox="set">B</a>
      <a href="c.jpg" data-lightbox="set">C</a>
    `);
    endSpy = jest.spyOn(lightbox, 'end').mockImplementation(() => {});
    click(links()[1]);
    changeImageSpy.mockClear();
  });

  it('moves with the previous and next controls', () => {
    click($q('#lightbox .lb-prev'));
    expect(changeImageSpy).toHaveBeenLastCalledWith(0);

    click($q('#lightbox .lb-next'));
    expect(changeImageSpy).toHaveBeenLastCalledWith(1);
  });

  it('closes when the empty area around the image is clicked', () => {
    click($q('#lightbox'));

    expect(endSpy).toHaveBeenCalled();
  });

  it('stays open when the image itself is clicked', () => {
    click($q('#lightbox .lb-image'));

    expect(endSpy).not.toHaveBeenCalled();
  });

  it('closes from the close and cancel buttons', () => {
    // Real buttons, so browsers also click them on Enter and Space.
    expect($q('#lightbox .lb-close').tagName).toBe('BUTTON');
    expect($q('#lightbox .lb-cancel').tagName).toBe('BUTTON');

    click($q('#lightbox .lb-close'));
    click($q('#lightbox .lb-cancel'));

    expect(endSpy).toHaveBeenCalledTimes(2);
  });
});

describe('keyboard', () => {
  let endSpy;

  beforeEach(() => {
    render(`
      <a href="a.jpg" data-lightbox="set">A</a>
      <a href="b.jpg" data-lightbox="set">B</a>
      <a href="c.jpg" data-lightbox="set">C</a>
    `);
    endSpy = jest.spyOn(lightbox, 'end').mockImplementation(() => {});
    click(links()[1]);
    changeImageSpy.mockClear();
    // Keyboard navigation turns on once an image has been shown.
    lightbox.enableKeyboardNav();
  });

  afterEach(() => {
    lightbox.disableKeyboardNav();
  });

  it('moves with the arrow keys', () => {
    keyup($q('#lightbox'), 'ArrowLeft');
    expect(changeImageSpy).toHaveBeenLastCalledWith(0);

    keyup($q('#lightbox'), 'ArrowRight');
    expect(changeImageSpy).toHaveBeenLastCalledWith(1);
  });

  it('closes on Escape without letting the key reach the page', () => {
    const documentListener = jest.fn();
    document.addEventListener('keyup', documentListener);

    keyup($q('#lightbox'), 'Escape');

    expect(endSpy).toHaveBeenCalled();
    expect(documentListener).not.toHaveBeenCalled();
    document.removeEventListener('keyup', documentListener);
  });

  it('keeps the browser\'s Escape keydown and its trailing keyup from reaching the page', () => {
    const documentListener = jest.fn();
    document.addEventListener('keydown', documentListener);
    document.addEventListener('keyup', documentListener);

    $q('#lightbox').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    // By the time the key comes up the dialog has closed and focus is back on the page.
    keyup(document.body, 'Escape');
    keyup(document.body, 'Escape');

    expect(documentListener).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', documentListener);
    document.removeEventListener('keyup', documentListener);
  });

  it('ignores keys while navigation is disabled', () => {
    lightbox.disableKeyboardNav();

    keyup($q('#lightbox'), 'ArrowRight');

    expect(changeImageSpy).not.toHaveBeenCalled();
  });
});

describe('closing', () => {
  beforeEach(() => {
    render('<a href="a.jpg" data-lightbox="set">A</a><a href="b.jpg" data-lightbox="set">B</a>');
    click(links()[0]);
    lightbox.enableKeyboardNav();
  });

  it('closes the dialog and stops keyboard navigation', () => {
    lightbox.end();

    expect($q('#lightbox').open).toBe(false);
    keyup($q('#lightbox'), 'ArrowRight');
    expect(changeImageSpy).toHaveBeenCalledTimes(1);
  });

  it('cleans up when the browser closes the dialog itself, e.g. on Escape', () => {
    $q('#lightbox').close();

    keyup($q('#lightbox'), 'ArrowRight');
    expect(changeImageSpy).toHaveBeenCalledTimes(1);
  });
});

describe('showing an image', () => {
  beforeEach(() => {
    // Let the real changeImage run; the decode() stand-in resolves immediately.
    changeImageSpy.mockRestore();
    render(`
      <a href="a.jpg" data-lightbox="set" data-lb-title="First" data-lb-width="400" data-lb-height="300">A</a>
      <a href="b.jpg" data-lightbox="set" data-lb-title="Second" data-lb-width="300" data-lb-height="400">B</a>
    `);
  });

  it('loads, sizes, and reveals the image with its details and navigation', async () => {
    click(links()[0]);
    expect($q('#lightbox').dataset.state).toBe('loading');

    await settle();

    expect($q('#lightbox').dataset.state).toBe('ready');
    expect($q('#lightbox .lb-image').src).toBe(links()[0].href);
    expect($q('#lightbox .lb-image').style.width).toBe('400px');
    expect($q('#lightbox .lb-title').textContent).toBe('First');
    expect($q('#lightbox .lb-prev').hidden).toBe(true);
    expect($q('#lightbox .lb-next').hidden).toBe(false);
  });

  it('shows only the latest image when changed again before loading finished', async () => {
    click(links()[0]);
    lightbox.changeImage(1);

    await settle();

    expect($q('#lightbox .lb-title').textContent).toBe('Second');
    expect($q('#lightbox .lb-image').style.width).toBe('300px');
    expect($q('#lightbox .lb-prev').hidden).toBe(false);
    expect($q('#lightbox .lb-next').hidden).toBe(true);
  });

  it('does not reveal an image that finishes loading after the lightbox closed', async () => {
    click(links()[0]);
    lightbox.end();

    await settle();

    expect($q('#lightbox').dataset.state).toBe('loading');
  });

  it('shows navigation in both directions when wrapAround is set', async () => {
    lightbox.option({ wrapAround: true });
    click(links()[0]);

    await settle();
    lightbox.option({ wrapAround: false });

    expect($q('#lightbox .lb-prev').hidden).toBe(false);
    expect($q('#lightbox .lb-next').hidden).toBe(false);
  });
});

describe('metadata attributes', () => {
  function openWith(attributes, thumbnailAlt = 'Thumb alt') {
    render(`<a href="full.jpg" data-lightbox="meta" ${attributes}><img alt="${thumbnailAlt}" src="thumb.jpg" /></a>`);
    click(links()[0]);
    return lightbox.album[0];
  }

  it('reads title, caption, copyright and alt from data attributes', () => {
    const image = openWith('data-lb-title="T" data-lb-caption="C" data-lb-copyright="© Me" data-lb-alt="A"');

    expect(image).toMatchObject({
      title: 'T',
      caption: 'C',
      copyright: '© Me',
      alt: 'A'
    });
  });

  it('does not use the link title attribute as the title', () => {
    expect(openWith('title="Tooltip"').title).toBeUndefined();
  });

  it('falls back to the thumbnail alt when data-lb-alt is absent', () => {
    expect(openWith('', 'From thumbnail').alt).toBe('From thumbnail');
  });

  it('honors an explicitly empty data-lb-alt', () => {
    expect(openWith('data-lb-alt=""', 'From thumbnail').alt).toBe('');
  });

  it('renders every field and wires up aria references', () => {
    openWith('data-lb-title="T" data-lb-caption="C" data-lb-copyright="© Me"');

    lightbox.updateDetails();

    expect($q('#lightbox .lb-title').textContent).toBe('T');
    expect($q('#lightbox .lb-caption').textContent).toBe('C');
    expect($q('#lightbox .lb-copyright').textContent).toBe('© Me');
    expect($q('#lightbox').getAttribute('aria-labelledby')).toBe('lb-title');
    expect($q('#lightbox .lb-image').getAttribute('aria-describedby')).toBe('lb-caption lb-copyright');
  });

  it('hides missing fields and drops their aria references', () => {
    openWith('data-lb-caption="Only a caption"');

    lightbox.updateDetails();

    expect(isHidden($q('#lightbox .lb-title'))).toBe(true);
    expect(isHidden($q('#lightbox .lb-copyright'))).toBe(true);
    expect($q('#lightbox .lb-caption').textContent).toBe('Only a caption');
    expect($q('#lightbox').hasAttribute('aria-labelledby')).toBe(false);
    expect($q('#lightbox .lb-image').getAttribute('aria-describedby')).toBe('lb-caption');
  });

  it('renders markup in metadata as plain text', () => {
    openWith('data-lb-title="&lt;b&gt;bold&lt;/b&gt;"');

    lightbox.updateDetails();

    expect($q('#lightbox .lb-title').textContent).toBe('<b>bold</b>');
    expect($q('#lightbox .lb-title b')).toBeNull();
  });

  it('labels the image count only for albums', () => {
    openWith('');
    lightbox.updateDetails();
    expect(isHidden($q('#lightbox .lb-number'))).toBe(true);

    render('<a href="a.jpg" data-lightbox="set">A</a><a href="b.jpg" data-lightbox="set">B</a>');
    click(links()[1]);
    lightbox.updateDetails();
    expect($q('#lightbox .lb-number').textContent).toBe('Image 2 of 2');
  });
});

describe('picture sources', () => {
  function openWith(attributes) {
    render(`<a href="full.avif" data-lightbox="pictures" ${attributes}><img alt="Thumb" src="thumb.jpg" /></a>`);
    click(links()[0]);
    return lightbox.album[0];
  }

  const source = () => $q('#lightbox .lb-source');
  const image = () => $q('#lightbox .lb-image');

  it('resolves the fallback href and reads dimensions', () => {
    const entry = openWith('data-lb-href-fallback="full.jpg" data-lb-width="1200" data-lb-height="800"');

    expect(entry.fallback).toBe(new URL('full.jpg', document.baseURI).href);
    expect(entry.width).toBe(1200);
    expect(entry.height).toBe(800);
  });

  it('ignores incomplete or invalid dimensions', () => {
    expect(openWith('data-lb-width="1200"')).toMatchObject({ width: undefined, height: undefined });
    expect(openWith('data-lb-width="wide" data-lb-height="800"')).toMatchObject({ width: undefined, height: undefined });
  });

  it('offers the link as a typed source with the fallback on the img', () => {
    const entry = openWith('data-lb-href-fallback="full.jpg" data-lb-alt="Full"');

    lightbox.setImageSources(entry);

    expect(source().getAttribute('srcset')).toBe(entry.link);
    expect(source().getAttribute('type')).toBe('image/avif');
    expect(image().src).toBe(entry.fallback);
    expect(image().alt).toBe('Full');
  });

  it('prefers a page-supplied type hint over the file extension', () => {
    const entry = openWith('data-lb-href-fallback="full.jpg" data-lb-typehint-fallback="image/jxl"');

    lightbox.setImageSources(entry);

    expect(entry.typeHint).toBe('image/jxl');
    expect(source().getAttribute('type')).toBe('image/jxl');
  });

  it('uses the type hint for links without a recognizable extension', () => {
    lightbox.setImageSources({
      alt: '',
      link: 'http://localhost/image?id=1',
      fallback: 'http://localhost/image.jpg',
      typeHint: 'image/avif'
    });

    expect(source().getAttribute('type')).toBe('image/avif');
  });

  it('omits the type for unrecognized extensions', () => {
    lightbox.setImageSources({ alt: '', link: 'http://localhost/image.unknown', fallback: 'http://localhost/image.jpg' });

    expect(source().hasAttribute('type')).toBe(false);
  });

  it('clears the source when an image has no fallback', () => {
    lightbox.setImageSources(openWith('data-lb-href-fallback="full.jpg"'));

    lightbox.setImageSources({ alt: '', link: 'http://localhost/plain.jpg' });

    expect(source().hasAttribute('srcset')).toBe(false);
    expect(source().hasAttribute('type')).toBe(false);
    expect(image().src).toBe('http://localhost/plain.jpg');
  });
});
