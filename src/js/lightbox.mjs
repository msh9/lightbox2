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

function Lightbox(options) {
  this.album = [];
  this.currentImageIndex = void 0;
  this.init();

  // options
  this.options = $.extend({}, this.constructor.defaults);
  this.option(options);
}

// Descriptions of all options available on the demo site:
// http://lokeshdhakar.com/projects/lightbox2/index.html#options
Lightbox.defaults = {
  albumLabel: 'Image %1 of %2',
  alwaysShowNavOnTouchDevices: false,
  fadeDuration: 600,
  fitImagesInViewport: true,
  imageFadeDuration: 600,
  // maxWidth: 800,
  // maxHeight: 600,
  positionFromTop: 50,
  resizeDuration: 700,
  showImageNumberLabel: true,
  wrapAround: false,
  disableScrolling: false
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

// Build html for the lightbox and the overlay.
// Attach event handlers to the new DOM elements. click click click
Lightbox.prototype.build = function() {
  if ($('#lightbox').length > 0) {
    return;
  }

  // The two root notes generated, #lightboxOverlay and #lightbox are given
  // tabindex attrs so they are focusable. We attach our keyboard event
  // listeners to these two elements, and not the document. Clicking anywhere
  // while Lightbox is opened will keep the focus on or inside one of these
  // two elements.
  //
  // We do this so we can prevent propagation of the Esc keypress when
  // Lightbox is open. This prevents it from interfering with other components
  // on the page below.
  //
  // Github issue: https://github.com/lokesh/lightbox2/issues/663
  $('<div id="lightboxOverlay" tabindex="-1" class="lightbox-overlay"></div><div id="lightbox" tabindex="-1" class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer"><div class="lb-outer-container"><div class="lb-container"><picture class="lb-picture"><source class="lb-source"/><img class="lb-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt=""/></picture><div class="lb-nav"><a class="lb-prev" role="button" tabindex="0" aria-label="Previous image" href="" ></a><a class="lb-next" role="button" tabindex="0" aria-label="Next image" href="" ></a></div><div class="lb-loader"><a class="lb-cancel" role="button" tabindex="0"></a></div></div></div><div class="lb-data-container"><div class="lb-data"><div class="lb-details"><span class="lb-title" id="lb-title"></span><span class="lb-caption" id="lb-caption"></span><span class="lb-copyright" id="lb-copyright"></span><span class="lb-number"></span></div><div class="lb-closeContainer"><a class="lb-close" role="button" tabindex="0"></a></div></div></div></div>').appendTo($('body'));

  // Cache jQuery objects
  this.$lightbox       = $('#lightbox');
  this.$overlay        = $('#lightboxOverlay');
  this.$outerContainer = this.$lightbox.find('.lb-outer-container');
  this.$container      = this.$lightbox.find('.lb-container');
  this.$image          = this.$lightbox.find('.lb-image');
  this.$source         = this.$lightbox.find('.lb-source');
  this.$nav            = this.$lightbox.find('.lb-nav');

  // Store css values for future lookup
  this.containerPadding = {
    top: parseInt(this.$container.css('padding-top'), 10),
    right: parseInt(this.$container.css('padding-right'), 10),
    bottom: parseInt(this.$container.css('padding-bottom'), 10),
    left: parseInt(this.$container.css('padding-left'), 10)
  };

  this.imageBorderWidth = {
    top: parseInt(this.$image.css('border-top-width'), 10),
    right: parseInt(this.$image.css('border-right-width'), 10),
    bottom: parseInt(this.$image.css('border-bottom-width'), 10),
    left: parseInt(this.$image.css('border-left-width'), 10)
  };

  this.$overlay.hide();
  this.$lightbox.hide();

  attachControls(this);
};

// Show overlay and lightbox. If the image is part of a set, add siblings to album array.
Lightbox.prototype.start = function($link) {
  var $window = $(window);

  $window.on('resize', $.proxy(this.sizeOverlay, this));

  this.sizeOverlay();

  const { album, index: imageNumber } = buildAlbum($link);
  this.album = album;

  // Position Lightbox
  var top  = $window.scrollTop() + this.options.positionFromTop;
  var left = $window.scrollLeft();
  this.$lightbox.css({
    top: top + 'px',
    left: left + 'px'
  }).fadeIn(this.options.fadeDuration);

  // Disable scrolling of the page while open
  if (this.options.disableScrolling) {
    $('body').addClass('lb-disable-scrolling');
  }

  this.changeImage(imageNumber);
};

// Hide most UI elements in preparation for the animated resizing of the lightbox.
Lightbox.prototype.changeImage = function(imageNumber) {
  var self = this;
  var image = this.album[imageNumber];
  var filetype = image.link.split('.').slice(-1)[0];
  var $image = this.$lightbox.find('.lb-image');

  // Disable keyboard nav during transitions
  this.disableKeyboardNav();

  // Show loading state
  this.$overlay.fadeIn(this.options.fadeDuration);
  $('.lb-loader').fadeIn('slow');
  this.$lightbox.find('.lb-image, .lb-nav, .lb-prev, .lb-next, .lb-data-container, .lb-numbers').hide();
  this.$outerContainer.addClass('animating');

  // When image to show is preloaded, we send the width and height to sizeContainer()
  const preloader = loadPicture(image);
  preloader.addEventListener('load', function imageSourceLoaded() {
    self.setImageSources(image);

    // Dimensions given in the markup take precedence, e.g. for SVGs without an intrinsic size.
    const naturalWidth = image.width || preloader.naturalWidth;
    const naturalHeight = image.height || preloader.naturalHeight;

    const max = maxImageSize(
      { width: $(window).width(), height: $(window).height() },
      self.containerPadding,
      self.imageBorderWidth,
      self.options.positionFromTop
    );
    const size = fitImage(
      { width: naturalWidth, height: naturalHeight },
      max,
      filetype === 'svg',
      self.options
    );
    $image.width(size.width);
    $image.height(size.height);

    self.sizeContainer($image.width(), $image.height());
  });

  this.currentImageIndex = imageNumber;
};

// Show an album entry in the lightbox's <picture>.
Lightbox.prototype.setImageSources = function(image) {
  this.$image.attr('alt', image.alt);
  setPictureSources(this.$source[0], this.$image[0], image);
};

// Stretch overlay to fit the viewport
Lightbox.prototype.sizeOverlay = function() {
  var self = this;
  /*
    We use a setTimeout 0 to pause JS execution and let the rendering catch-up.
    Why do this? If the `disableScrolling` option is set to true, a class is added to the body
    tag that disables scrolling and hides the scrollbar. We want to make sure the scrollbar is
    hidden before we measure the document width, as the presence of the scrollbar will affect the
    number.
    */
  setTimeout(function() {
    self.$overlay
      .width($(document).width())
      .height($(document).height());

  }, 0);
};

// Animate the size of the lightbox to fit the image we are showing
// This method also shows the the image.
Lightbox.prototype.sizeContainer = function(imageWidth, imageHeight) {
  var self = this;

  var oldWidth  = this.$outerContainer.outerWidth();
  var oldHeight = this.$outerContainer.outerHeight();
  var newWidth  = imageWidth + this.containerPadding.left + this.containerPadding.right + this.imageBorderWidth.left + this.imageBorderWidth.right;
  var newHeight = imageHeight + this.containerPadding.top + this.containerPadding.bottom + this.imageBorderWidth.top + this.imageBorderWidth.bottom;

  function postResize() {
    self.$lightbox.find('.lb-data-container').width(newWidth);

    // Set focus on one of the two root nodes so keyboard events are captured.
    self.$overlay.trigger('focus');

    self.showImage();
  }

  if (oldWidth !== newWidth || oldHeight !== newHeight) {
    this.$outerContainer.animate({
      width: newWidth,
      height: newHeight
    }, this.options.resizeDuration, 'swing', postResize);
  } else {
    postResize();
  }
};

// Display the image and its details and begin preload neighboring images.
Lightbox.prototype.showImage = function() {
  this.$lightbox.find('.lb-loader').stop(true).hide();
  this.$lightbox.find('.lb-image').fadeIn(this.options.imageFadeDuration);

  this.updateNav();
  this.updateDetails();
  this.preloadNeighboringImages();
  this.enableKeyboardNav();
};

// Display previous and next navigation if appropriate.
Lightbox.prototype.updateNav = function() {
  // Check to see if the browser supports touch events. If so, we take the conservative approach
  // and assume that mouse hover events are not supported and always show prev/next navigation
  // arrows in image sets.
  const alwaysShowNav = this.options.alwaysShowNavOnTouchDevices;
  this.$lightbox.find('.lb-nav').show();

  if (this.album.length > 1) {
    if (this.options.wrapAround) {
      if (alwaysShowNav) {
        this.$lightbox.find('.lb-prev, .lb-next').css('opacity', '1');
      }
      this.$lightbox.find('.lb-prev, .lb-next').show();
    } else {
      if (this.currentImageIndex > 0) {
        this.$lightbox.find('.lb-prev').show();
        if (alwaysShowNav) {
          this.$lightbox.find('.lb-prev').css('opacity', '1');
        }
      }
      if (this.currentImageIndex < this.album.length - 1) {
        this.$lightbox.find('.lb-next').show();
        if (alwaysShowNav) {
          this.$lightbox.find('.lb-next').css('opacity', '1');
        }
      }
    }
  }
};

// Display title, caption, copyright, image number, and closing button.
// All text is rendered as plain text and every field is optional.
Lightbox.prototype.updateDetails = function() {
  var self = this;
  const currentImage = this.album[this.currentImageIndex];

  function renderText(className, value) {
    const $node = self.$lightbox.find('.' + className);
    if (!value) {
      $node.text('').hide();
      return false;
    }
    $node.text(value).fadeIn('fast');
    return true;
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

  if (this.album.length > 1 && this.options.showImageNumberLabel) {
    var labelText = this.imageCountLabel(this.currentImageIndex + 1, this.album.length);
    this.$lightbox.find('.lb-number').text(labelText).fadeIn('fast');
  } else {
    this.$lightbox.find('.lb-number').hide();
  }

  this.$outerContainer.removeClass('animating');

  this.$lightbox.find('.lb-data-container').fadeIn(this.options.resizeDuration, function() {
    return self.sizeOverlay();
  });
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
  this.$overlay.on('keyup.keyboard', $.proxy(this.keyboardAction, this));
};

Lightbox.prototype.disableKeyboardNav = function() {
  this.$lightbox.off('.keyboard');
  this.$overlay.off('.keyboard');
};

Lightbox.prototype.keyboardAction = function(event) {
  handleKeyboard(this, event);
};

// Closing time. :-(
Lightbox.prototype.end = function() {
  this.disableKeyboardNav();
  $(window).off('resize', this.sizeOverlay);
  this.$lightbox.fadeOut(this.options.fadeDuration);
  this.$overlay.fadeOut(this.options.fadeDuration);

  if (this.options.disableScrolling) {
    $('body').removeClass('lb-disable-scrolling');
  }
};

export default new Lightbox();
