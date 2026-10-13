/*
 * SPDX-License-Identifier: MIT
 * Original work: © 2015-2025 Lokesh Dhakar
 * Modifications: © 2025-2026 Michael Hughes
 *
 */
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

// Esc closes the lightbox; the arrow keys move through the album, wrapping only when the
// wrapAround option is set.
export function handleKeyboard(lightbox, event) {
  const wrap = lightbox.options.wrapAround && lightbox.album.length > 1;

  if (event.key === 'Escape') {
    // Prevent bubbling so as to not affect other components on the page.
    event.stopPropagation();
    lightbox.end();
  } else if (event.key === 'ArrowLeft') {
    showPrevious(lightbox, wrap);
  } else if (event.key === 'ArrowRight') {
    showNext(lightbox, wrap);
  }
}

// Attach handlers to the lightbox's own controls: the empty area around the image, the close and
// cancel buttons, the previous/next areas, and the keyboard.
export function attachControls(lightbox) {
  const { dialog, nav } = lightbox;

  // The dialog fills the viewport, so a click that lands on the dialog itself missed its content.
  dialog.addEventListener('click', function(event) {
    if (event.target === dialog) {
      lightbox.end();
    }
  });

  // The previous/next areas are only shown when there is somewhere to go, so they always wrap.
  dialog.querySelector('.lb-prev').addEventListener('click', function handleClickPrevious() {
    showPrevious(lightbox, true);
  });

  dialog.querySelector('.lb-next').addEventListener('click', function handleClickNext() {
    showNext(lightbox, true);
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
  nav.addEventListener('mousedown', function(event) {
    if (event.button === 2) {
      nav.style.pointerEvents = 'none';

      dialog.addEventListener('contextmenu', function() {
        setTimeout(function() {
          nav.style.pointerEvents = '';
        }, 0);
      }, { once: true });
    }
  });

  // Buttons also click on Enter and Space.
  for (const button of dialog.querySelectorAll('.lb-cancel, .lb-close')) {
    button.addEventListener('click', function() {
      lightbox.end();
    });
  }

  // The browser closes the dialog on the Escape keydown; the matching keyup then lands on the page
  // once focus has returned there. Keep both from reaching other components, which might close
  // themselves too (lokesh/lightbox2#663).
  dialog.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') {
      return;
    }
    event.stopPropagation();
    window.addEventListener('keyup', function(keyupEvent) {
      if (keyupEvent.key === 'Escape') {
        keyupEvent.stopPropagation();
      }
    }, { capture: true, once: true });
  });

  dialog.addEventListener('keyup', function(event) {
    if (lightbox.keyboardEnabled) {
      handleKeyboard(lightbox, event);
    }
  });
}
