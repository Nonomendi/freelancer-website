/* Scroll reveal.
   Progressive by construction: the hiding class is added here, so if this
   script never runs the content is visible from the start.

   There is also a failsafe. Hiding content and waiting for an event to
   un-hide it is a pattern that fails badly — if the observer never fires,
   the whole page below the hero is blank and the visitor sees an empty
   site. So if nothing has revealed shortly after load, the hiding is
   abandoned entirely and everything is shown. A missing animation is a
   non-event; an invisible site is not. */
(function () {
  'use strict';

  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  // No IntersectionObserver (old browser) — leave everything visible.
  if (!('IntersectionObserver' in window)) return;

  // Honour the OS setting: skip the whole mechanism rather than animate.
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  var root = document.documentElement;
  root.classList.add('reveal-ready');

  var revealedCount = 0;

  function reveal(el) {
    el.classList.add('is-visible');
    revealedCount++;
  }

  /** Abandon the effect and show everything. Safe to call more than once. */
  function showEverything() {
    root.classList.remove('reveal-ready');
    for (var i = 0; i < items.length; i++) items[i].classList.add('is-visible');
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Stagger siblings slightly so a grid arrives as a wave, not a jolt.
        var delay = Number(entry.target.dataset.revealDelay || 0);
        setTimeout(function () {
          reveal(entry.target);
        }, delay);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  var observedAny = false;

  items.forEach(function (el) {
    // Anything already on screen at load reveals immediately — no fade-in
    // for content the visitor is looking at before they scroll.
    var box = el.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.9) {
      reveal(el);
      return;
    }
    if (!el.dataset.revealDelay) {
      var siblingIndex = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.dataset.revealDelay = String(Math.min(siblingIndex, 4) * 70);
    }
    observer.observe(el);
    observedAny = true;
  });

  // Failsafe: if we hid things and nothing at all has come back after a
  // couple of seconds, the observer is not working in this environment.
  // Give up on the animation rather than leave the page blank.
  if (observedAny) {
    setTimeout(function () {
      if (revealedCount === 0) {
        observer.disconnect();
        showEverything();
      }
    }, 2000);
  }

  // Same reasoning for a tab restored from the back/forward cache, where
  // observers can be in an odd state.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) showEverything();
  });
})();
