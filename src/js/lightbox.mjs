/*
 * SPDX-License-Identifier: MIT
 * Original work: © 2015-2025 Lokesh Dhakar
 * Modifications: © 2025-2026 Michael Hughes
 *
 */
import $ from 'jquery';
import { attachControls, handleKeyboard } from './actions.mjs';
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
function afterTransition(element) {
  const durations = getComputedStyle(element).transitionDuration.split(',').map(parseFloat);
  const longest = Math.max(...durations) * 1000;
  if (!(longest > 0)) {
    return Promise.resolve();
  }
  return new Promise(function(resolve) {
    let timer;
    function done() {
      clearTimeout(timer);
      element.removeEventListener('transitionend', done);
      resolve();
    }
    timer = setTimeout(done, longest + 100);
    element.addEventListener('transitionend', done);
  });
}

function Lightbox(options) {
  this.album = [];
  this.currentImageIndex = void 0;
  // Incremented on every image change and on close, so that stale loads know to stop.
  this.changeId = 0;
  this.init();

  // options
  this.options = $.extend({}, this.constructor.defaults);
  this.option(options);
}

// Fade and resize timings are CSS custom properties; see lightbox.css.
Lightbox.defaults = {
  albumLabel: 'Image %1 of %2',
  showImageNumberLabel: true,
  wrapAround: false
};

Lightbox.prototype.option = function(options) {
  $.extend(this.options, options);
};

Lightbox.prototype.imageCountLabel = function(currentImageNum, totalImages) {
  return this.options.albumLabel.replace(/%1/g, currentImageNum).replace(/%2/g, totalImages);
};

Lightbox.prototype.init = function() {
  var self = this;
  // Both enable and build methods require the body tag to be in the DOM.
  $(function() {
    self.enable();
    self.build();
  });
};

// Loop through anchors and areamaps looking for either data-lightbox attributes or rel attributes
// that contain 'lightbox'. When these are clicked, start lightbox.
Lightbox.prototype.enable = function() {
  var self = this;
  $('body').on('click', 'a[data-lightbox], area[data-lightbox]', function(event) {
    self.start($(event.currentTarget));
    return false;
  });
};

// Build the lightbox <dialog> and attach its event handlers. Opened as a modal, the dialog
// provides the backdrop, keeps focus and clicks inside it, and closes on Escape.
Lightbox.prototype.build = function() {
  if ($('#lightbox').length > 0) {
    return;
  }

  $(TEMPLATE).appendTo($('body'));

  // Cache jQuery objects
  this.$lightbox       = $('#lightbox');
  this.$outerContainer = this.$lightbox.find('.lb-outer-container');
  this.$container      = this.$lightbox.find('.lb-container');
  this.$image          = this.$lightbox.find('.lb-image');
  this.$source         = this.$lightbox.find('.lb-source');
  this.$nav            = this.$lightbox.find('.lb-nav');
  this.dialog          = this.$lightbox[0];

  // Store css values for future lookup
  this.containerPadding = {
    top: parseInt(this.$container.css('padding-top'), 10) || 0,
    right: parseInt(this.$container.css('padding-right'), 10) || 0,
    bottom: parseInt(this.$container.css('padding-bottom'), 10) || 0,
    left: parseInt(this.$container.css('padding-left'), 10) || 0
  };

  this.imageBorderWidth = {
    top: parseInt(this.$image.css('border-top-width'), 10) || 0,
    right: parseInt(this.$image.css('border-right-width'), 10) || 0,
    bottom: parseInt(this.$image.css('border-bottom-width'), 10) || 0,
    left: parseInt(this.$image.css('border-left-width'), 10) || 0
  };

  // Every way of closing, including Escape handled by the browser, ends with a close event.
  this.dialog.addEventListener('close', this.cleanUp.bind(this));

  attachControls(this);
};

// Open the lightbox at the clicked link, with the rest of its album available for navigation.
Lightbox.prototype.start = function($link) {
  const { album, index: imageNumber } = buildAlbum($link);
  this.album = album;

  if (!this.dialog.open) {
    this.dialog.showModal();
    // Focus the dialog itself so the keyboard works before any of its controls are shown.
    this.dialog.focus();
  }

  this.changeImage(imageNumber);
};

// Hide the current image, load the requested one, resize to fit it, and then show it.
Lightbox.prototype.changeImage = function(imageNumber) {
  const self = this;
  const image = this.album[imageNumber];
  const isSvg = image.link.split('.').slice(-1)[0] === 'svg';
  const img = this.$image[0];
  const changeId = ++this.changeId;

  this.currentImageIndex = imageNumber;

  // Disable keyboard nav during transitions
  this.disableKeyboardNav();
  this.dialog.dataset.state = 'loading';

  this.setImageSources(image);

  // With dimensions in the markup the resize can start while the image is still loading.
  const resized = image.width && image.height ? this.sizeContainer(image.width, image.height, isSvg) : null;

  // decode() rejects for broken images too; carry on regardless so the spinner never hangs.
  img.decode().catch(function() {}).then(function() {
    if (changeId !== self.changeId) {
      return null;
    }
    return resized || self.sizeContainer(img.naturalWidth, img.naturalHeight, isSvg);
  }).then(function() {
    if (changeId === self.changeId) {
      self.showImage();
    }
  });
};

// Show an album entry in the lightbox's <picture>.
Lightbox.prototype.setImageSources = function(image) {
  this.$image.attr('alt', image.alt);
  setPictureSources(this.$source[0], this.$image[0], image);
};

// Size the image to fit the viewport and resize the container around it. The container's size
// change is animated in CSS; the returned promise resolves once it has finished.
Lightbox.prototype.sizeContainer = function(naturalWidth, naturalHeight, isSvg) {
  const outerContainer = this.$outerContainer[0];
  const img = this.$image[0];
  const max = maxImageSize(
    { width: window.innerWidth, height: window.innerHeight },
    this.containerPadding,
    this.imageBorderWidth,
    VIEWPORT_MARGIN_TOP
  );
  const size = fitImage({ width: naturalWidth, height: naturalHeight }, max, isSvg);

  img.style.width = size.width + 'px';
  img.style.height = size.height + 'px';

  const newWidth = size.width + this.containerPadding.left + this.containerPadding.right + this.imageBorderWidth.left + this.imageBorderWidth.right;
  const newHeight = size.height + this.containerPadding.top + this.containerPadding.bottom + this.imageBorderWidth.top + this.imageBorderWidth.bottom;

  this.$lightbox.find('.lb-data-container')[0].style.width = newWidth + 'px';

  if (outerContainer.offsetWidth === newWidth && outerContainer.offsetHeight === newHeight) {
    return Promise.resolve();
  }
  outerContainer.style.width = newWidth + 'px';
  outerContainer.style.height = newHeight + 'px';
  return afterTransition(outerContainer);
};

// Display the image and its details and begin preload neighboring images.
Lightbox.prototype.showImage = function() {
  this.updateNav();
  this.updateDetails();
  this.dialog.dataset.state = 'ready';

  // Keep focus inside the dialog, e.g. when it was on the cancel button that just disappeared.
  if (!this.dialog.contains(document.activeElement)) {
    this.dialog.focus();
  }

  this.preloadNeighboringImages();
  this.enableKeyboardNav();
};

// Display previous and next navigation if appropriate.
Lightbox.prototype.updateNav = function() {
  const hasAlbum = this.album.length > 1;
  const wrap = this.options.wrapAround;

  this.$lightbox.find('.lb-prev')[0].hidden = !(hasAlbum && (wrap || this.currentImageIndex > 0));
  this.$lightbox.find('.lb-next')[0].hidden = !(hasAlbum && (wrap || this.currentImageIndex < this.album.length - 1));
};

// Display title, caption, copyright, image number, and closing button.
// All text is rendered as plain text and every field is optional.
Lightbox.prototype.updateDetails = function() {
  var self = this;
  const currentImage = this.album[this.currentImageIndex];

  function renderText(className, value) {
    const node = self.$lightbox.find('.' + className)[0];
    node.textContent = value || '';
    node.hidden = !value;
    return Boolean(value);
  }

  const hasTitle = renderText('lb-title', currentImage.title);
  const describedBy = ['caption', 'copyright']
    .filter((field) => renderText('lb-' + field, currentImage[field]))
    .map((field) => 'lb-' + field);

  // Name the dialog after the image title, falling back to the generic aria-label.
  if (hasTitle) {
    this.$lightbox.attr('aria-labelledby', 'lb-title');
  } else {
    this.$lightbox.removeAttr('aria-labelledby');
  }
  if (describedBy.length) {
    this.$image.attr('aria-describedby', describedBy.join(' '));
  } else {
    this.$image.removeAttr('aria-describedby');
  }

  const showNumber = this.album.length > 1 && this.options.showImageNumberLabel;
  renderText('lb-number', showNumber ? this.imageCountLabel(this.currentImageIndex + 1, this.album.length) : '');
};

// Preload previous and next images in set.
Lightbox.prototype.preloadNeighboringImages = function() {
  if (this.album.length > this.currentImageIndex + 1) {
    loadPicture(this.album[this.currentImageIndex + 1]);
  }
  if (this.currentImageIndex > 0) {
    loadPicture(this.album[this.currentImageIndex - 1]);
  }
};

Lightbox.prototype.enableKeyboardNav = function() {
  this.$lightbox.on('keyup.keyboard', $.proxy(this.keyboardAction, this));
};

Lightbox.prototype.disableKeyboardNav = function() {
  this.$lightbox.off('.keyboard');
};

Lightbox.prototype.keyboardAction = function(event) {
  handleKeyboard(this, event);
};

// Closing time. :-(
Lightbox.prototype.end = function() {
  if (this.dialog.open) {
    this.dialog.close();
  }
};

// Runs however the dialog was closed. Abandons any image that is still loading.
Lightbox.prototype.cleanUp = function() {
  this.changeId++;
  this.disableKeyboardNav();
};

export default new Lightbox();
