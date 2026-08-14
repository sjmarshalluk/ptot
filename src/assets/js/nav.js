/*
 * nav.js — mobile navigation disclosure.
 *
 * The panel is a plain block on wide screens; below the nav breakpoint it
 * collapses behind a button. Progressive enhancement: with JS off, .nav-panel
 * has no [hidden] attribute and stays visible, so every link remains reachable.
 */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('nav-menu');
  if (!toggle || !panel) return;

  var mq = window.matchMedia('(max-width: 900px)');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  }

  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  // Only collapse when the button is actually on screen — otherwise the panel
  // is the desktop nav and must never be hidden.
  function sync() {
    if (mq.matches) {
      setOpen(false);
    } else {
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }
  }

  toggle.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  // A link tap inside the open panel navigates; close so the next page starts clean.
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a') && isOpen()) setOpen(false);
  });

  if (mq.addEventListener) mq.addEventListener('change', sync);
  else mq.addListener(sync);

  sync();
})();
