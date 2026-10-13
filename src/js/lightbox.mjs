/*
 * SPDX-License-Identifier: MIT
 * Original work: © 2015-2025 Lokesh Dhakar
 * Modifications: © 2025-2026 Michael Hughes
 *
 */
import { attachControls } from './actions.mjs';
import { buildAlbum } from './album.mjs';
import { fitImage, maxImageSize } from './layout.mjs';
import { loadPicture, setPictureSources } from './picture.mjs';

// Room kept free above the image when fitting it to the viewport.
const VIEWPORT_MARGIN_TOP = 50;

const TEMPLATE = `
<dialog id="lightbox" class="lightbox" tabindex="-1" aria-label="Image viewer">
  <div class="lb-outer-container">
    <div class="lb-container">
      <picture class="lb-picture"><source class="lb-source"><img class="lb-image" alt=""></picture>
      <div class="lb-nav">
        <button type="button" class="lb-prev" aria-label="Previous image" hidden></button>
        <button type="button" class="lb-next" aria-label="Next image" hidden></button>
      </div>
      <div class="lb-loader"><button type="button" class="lb-cancel" aria-label="Close"></button></div>
    </div>
  </div>
  <div class="lb-data-container">
    <div class="lb-data">
      <div class="lb-details">
        <span class="lb-title" id="lb-title" hidden></span>
        <span class="lb-caption" id="lb-caption" hidden></span>
        <span class="lb-copyright" id="lb-copyright" hidden></span>
        <span class="lb-number" hidden></span>
      </div>
      <div class="lb-closeContainer"><button type="button" class="lb-close" aria-label="Close"></button></div>
    </div>
  </div>
</dialog>`;

// Resolve once the element's CSS transition has run, or straight away when it has no duration
// (for example under prefers-reduced-motion). The timer covers a transitionend that never fires.
async function afterTransition(element) {
  const durations = getComputedStyle(element).transitionDuration.split(',').map(parseFloat);
  const longest = Math.max(...durations) * 1000;
  if (!(longest > 0)) {
    return
  }

  return new Promise((resolve) => {
    let timer;
    function done() {
      clearTimeout(timer);
      resolve();
    }
    timer = setTimeout(done, longest + 100);
    element.addEventListener('transitionend', done, { once: true });
  });
}

// Read an element's top/right/bottom/left values for a box property such as padding.
function boxSides(element, property, suffix = '') {
  const style = getComputedStyle(element);
  const side = (name) => parseFloat(style.getPropertyValue(`${property}-${name}${suffix}`)) || 0;
  return { top: side('top'), right: side('right'), bottom: side('bottom'), left: side('left') };
}

class Lightbox {
  // Fade and resize timings are CSS custom properties; see lightbox.css.
  static defaults = {
    albumLabel: 'Image %1 of %2',
    showImageNumberLabel: true,
    wrapAround: false
  };

  constructor(options) {
    this.album = [];
    this.currentImageIndex = undefined;
    // Incremented on every image change and on close, so that stale loads know to stop.
    this.changeId = 0;
    this.keyboardEnabled = false;
    this.initialized = false;
    this.options = { ...Lightbox.defaults, ...options };
  }

  option(options) {
    Object.assign(this.options, options);
  }

  imageCountLabel(currentImageNum, totalImages) {
    return this.options.albumLabel.replace(/%1/g, currentImageNum).replace(/%2/g, totalImages);
  }

  // Set up the lightbox: add its markup to the page and start listening for clicks on lightbox
  // links. Call once; it waits for the document to finish parsing if needed.
  init(options) {
    if (options) {
      this.option(options);
    }
    if (this.initialized) {
      return this;
    }
    this.initialized = true;

    const setUp = () => {
      this.build();
      this.enable();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setUp, { once: true });
    } else {
      setUp();
    }
    return this;
  }

  // Open the lightbox when a link with a data-lightbox attribute, or anything inside one, is clicked.
  enable() {
    document.body.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-lightbox]');
      if (!link) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.start(link);
    });
  }

  // Build the lightbox <dialog> and attach its event handlers. Opened as a modal, the dialog
  // provides the backdrop, keeps focus and clicks inside it, and closes on Escape.
  build() {
    if (document.getElementById('lightbox')) {
      return;
    }

    document.body.insertAdjacentHTML('beforeend', TEMPLATE);

    this.dialog         = document.getElementById('lightbox');
    this.outerContainer = this.dialog.querySelector('.lb-outer-container');
    this.container      = this.dialog.querySelector('.lb-container');
    this.image          = this.dialog.querySelector('.lb-image');
    this.source         = this.dialog.querySelector('.lb-source');
    this.nav            = this.dialog.querySelector('.lb-nav');
    this.dataContainer  = this.dialog.querySelector('.lb-data-container');

    // Store css values for future lookup
    this.containerPadding = boxSides(this.container, 'padding');
    this.imageBorderWidth = boxSides(this.image, 'border', '-width');

    // Every way of closing, including Escape handled by the browser, ends with a close event.
    this.dialog.addEventListener('close', () => {
      this.cleanUp()
    });

    attachControls(this);
  }

  // Open the lightbox at the clicked link, with the rest of its album available for navigation.
  start(link) {
    const { album, index } = buildAlbum(link);
    this.album = album;

    if (!this.dialog.open) {
      this.dialog.showModal();
      // Focus the dialog itself so the keyboard works before any of its controls are shown.
      this.dialog.focus();
    }

    this.changeImage(index);
  }

  // Hide the current image, load the requested one, resize to fit it, and then show it.
  async changeImage(imageNumber) {
    const image = this.album[imageNumber];
    const isSvg = image.link.split('.').slice(-1)[0] === 'svg';
    const imageElement = this.image;
    const changeId = ++this.changeId;

    this.currentImageIndex = imageNumber;

    // Disable keyboard nav during transitions
    this.disableKeyboardNav();
    this.dialog.dataset.state = 'loading';

    this.setImageSources(image);

    // With dimensions in the markup the resize can start while the image is still loading.
    const resized = image.width && image.height ? this.sizeContainer(image.width, image.height, isSvg) : null;

    // decode() rejects for broken images too; carry on regardless so the spinner never hangs.
    try {
      await imageElement.decode();
      if (changeId !== this.changeId) {
        return null;
      }
      if (!resized) {
        await this.sizeContainer(imageElement.naturalWidth, imageElement.naturalHeight, isSvg);
      }
      this.showImage();
    } catch (err) {
      console.log(err);
    }
  }

  // Show an album entry in the lightbox's <picture>.
  setImageSources(image) {
    this.image.alt = image.alt;
    setPictureSources(this.source, this.image, image);
  }

  // Size the image to fit the viewport and resize the container around it. The container's size
  // change is animated in CSS; the returned promise resolves once it has finished.
  async sizeContainer(naturalWidth, naturalHeight, isSvg) {
    const padding = this.containerPadding;
    const border = this.imageBorderWidth;
    const max = maxImageSize(
      { width: window.innerWidth, height: window.innerHeight },
      padding,
      border,
      VIEWPORT_MARGIN_TOP
    );
    const size = fitImage({ width: naturalWidth, height: naturalHeight }, max, isSvg);

    this.image.style.width = `${size.width}px`;
    this.image.style.height = `${size.height}px`;

    const newWidth = size.width + padding.left + padding.right + border.left + border.right;
    const newHeight = size.height + padding.top + padding.bottom + border.top + border.bottom;
    const newWidthStyle = `${newWidth}px`;

    this.dataContainer.style.width = newWidthStyle;

    const outerContainer = this.outerContainer;
    if (outerContainer.offsetWidth === newWidth && outerContainer.offsetHeight === newHeight) {
      return;
    }
    outerContainer.style.width = newWidthStyle;
    outerContainer.style.height = `${newHeight}px`;
    return afterTransition(outerContainer);
  }

  // Display the image and its details and begin preload neighboring images.
  showImage() {
    this.updateNav();
    this.updateDetails();
    this.dialog.dataset.state = 'ready';

    // Keep focus inside the dialog, e.g. when it was on the cancel button that just disappeared.
    if (!this.dialog.contains(document.activeElement)) {
      this.dialog.focus();
    }

    this.preloadNeighboringImages();
    this.enableKeyboardNav();
  }

  // Display previous and next navigation if appropriate.
  updateNav() {
    const hasAlbum = this.album.length > 1;
    const wrap = this.options.wrapAround;

    this.dialog.querySelector('.lb-prev').hidden = !(hasAlbum && (wrap || this.currentImageIndex > 0));
    this.dialog.querySelector('.lb-next').hidden = !(hasAlbum && (wrap || this.currentImageIndex < this.album.length - 1));
  }

  // Display title, caption, copyright, image number, and closing button.
  // All text is rendered as plain text and every field is optional.
  updateDetails() {
    const currentImage = this.album[this.currentImageIndex];

    const renderText = (className, value) => {
      const node = this.dialog.querySelector(`.${className}`);
      node.textContent = value || '';
      node.hidden = !value;
      return Boolean(value);
    };

    const hasTitle = renderText('lb-title', currentImage.title);
    const describedBy = ['caption', 'copyright']
      .filter((field) => renderText(`lb-${field}`, currentImage[field]))
      .map((field) => `lb-${field}`);

    // Name the dialog after the image title, falling back to the generic aria-label.
    if (hasTitle) {
      this.dialog.setAttribute('aria-labelledby', 'lb-title');
    } else {
      this.dialog.removeAttribute('aria-labelledby');
    }
    if (describedBy.length) {
      this.image.setAttribute('aria-describedby', describedBy.join(' '));
    } else {
      this.image.removeAttribute('aria-describedby');
    }

    const showNumber = this.album.length > 1 && this.options.showImageNumberLabel;
    renderText('lb-number', showNumber ? this.imageCountLabel(this.currentImageIndex + 1, this.album.length) : '');
  }

  // Preload previous and next images in set.
  preloadNeighboringImages() {
    if (this.album.length > this.currentImageIndex + 1) {
      loadPicture(this.album[this.currentImageIndex + 1]);
    }
    if (this.currentImageIndex > 0) {
      loadPicture(this.album[this.currentImageIndex - 1]);
    }
  }

  enableKeyboardNav() {
    this.keyboardEnabled = true;
  }

  disableKeyboardNav() {
    this.keyboardEnabled = false;
  }

  end() {
    if (this.dialog?.open) {
      this.dialog.close();
    }
  }

  // Runs however the dialog was closed. Abandons any image that is still loading.
  cleanUp() {
    this.changeId++;
    this.disableKeyboardNav();
  }
}

export default new Lightbox();
