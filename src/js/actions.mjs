/*
 * SPDX-License-Identifier: MIT
 * Original work: © 2015-2025 Lokesh Dhakar
 * Modifications: © 2025-2026 Michael Hughes
 *
 */
import $ from 'jquery';

const KEYCODE_ESC        = 27;
const KEYCODE_LEFTARROW  = 37;
const KEYCODE_RIGHTARROW = 39;

// The index before `index`, wrapping to the end when allowed. Null when there is nowhere to go.
export function previousIndex(index, length, wrap) {
  if (index > 0) {
    return index - 1;
  }
  return wrap ? length - 1 : null;
}

// The index after `index`, wrapping to the start when allowed. Null when there is nowhere to go.
export function nextIndex(index, length, wrap) {
  if (index < length - 1) {
    return index + 1;
  }
  return wrap ? 0 : null;
}

function showPrevious(lightbox, wrap) {
  const index = previousIndex(lightbox.currentImageIndex, lightbox.album.length, wrap);
  if (index !== null) {
    lightbox.changeImage(index);
  }
}

function showNext(lightbox, wrap) {
  const index = nextIndex(lightbox.currentImageIndex, lightbox.album.length, wrap);
  if (index !== null) {
    lightbox.changeImage(index);
  }
}

// Attach handlers to the lightbox's own controls: the overlay, close and cancel buttons, and the
// previous/next areas.
export function attachControls(lightbox) {
  lightbox.$overlay.on('click', function() {
    lightbox.end();
    return false;
  });

  lightbox.$lightbox.on('click', function(event) {
    if ($(event.target).attr('id') === 'lightbox') {
      lightbox.end();
    }
  });

  lightbox.$outerContainer.on('click', function(event) {
    if ($(event.target).attr('id') === 'lightbox') {
      lightbox.end();
    }
    return false;
  });

  // The previous/next areas are only shown when there is somewhere to go, so they always wrap.
  lightbox.$lightbox.find('.lb-prev').on('click', function handleClickPrevious() {
    showPrevious(lightbox, true);
    return false;
  });

  lightbox.$lightbox.find('.lb-next').on('click', function handleClickNext() {
    showNext(lightbox, true);
    return false;
  });

  /*
      Show context menu for image on right-click

      There is a div containing the navigation that spans the entire image and lives above of it. If
      you right-click, you are right clicking this div and not the image. This prevents users from
      saving the image or using other context menu actions with the image.

      To fix this, when we detect the right mouse button is pressed down, but not yet clicked, we
      set pointer-events to none on the nav div. This is so that the upcoming right-click event on
      the next mouseup will bubble down to the image. Once the right-click/contextmenu event occurs
      we set the pointer events back to auto for the nav div so it can capture hover and left-click
      events as usual.
     */
  lightbox.$nav.on('mousedown', function(event) {
    if (event.which === 3) {
      lightbox.$nav.css('pointer-events', 'none');

      lightbox.$lightbox.one('contextmenu', function() {
        setTimeout(function() {
          lightbox.$nav.css('pointer-events', 'auto');
        }, 0);
      });
    }
  });

  lightbox.$lightbox.find('.lb-loader, .lb-close').on('click keyup', function(e) {
    // If mouse click OR 'enter' or 'space' keypress, close LB
    if (
      e.type === 'click' || (e.type === 'keyup' && (e.which === 13 || e.which === 32))) {
      lightbox.end();
      return false;
    }
  });
}

// Esc closes the lightbox; the arrow keys move through the album, wrapping only when the
// wrapAround option is set.
export function handleKeyboard(lightbox, event) {
  const wrap = lightbox.options.wrapAround && lightbox.album.length > 1;
  const keycode = event.keyCode;

  if (keycode === KEYCODE_ESC) {
    // Prevent bubbling so as to not affect other components on the page.
    event.stopPropagation();
    lightbox.end();
  } else if (keycode === KEYCODE_LEFTARROW) {
    showPrevious(lightbox, wrap);
  } else if (keycode === KEYCODE_RIGHTARROW) {
    showNext(lightbox, wrap);
  }
}
