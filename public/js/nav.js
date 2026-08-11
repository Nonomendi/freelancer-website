/* Mobile navigation toggle.
   The panel exists in the DOM and is hidden with a class, so it degrades to
   nothing worse than the old behaviour if this script fails to load. */
(function () {
  'use strict';

  var toggle = document.getElementById('navToggle');
  var panel = document.getElementById('mobileNav');
  // Two inline SVGs; show one, hide the other.
  var iconClosed = toggle && toggle.querySelector('[data-nav-icon="closed"]');
  var iconOpen = toggle && toggle.querySelector('[data-nav-icon="open"]');

  if (!toggle || !panel) return;

  function setOpen(open) {
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    if (iconClosed) iconClosed.classList.toggle('hidden', open);
    if (iconOpen) iconOpen.classList.toggle('hidden', !open);
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Escape closes the menu and returns focus to the button.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Tapping a link closes the panel. Matters for same-page anchors like
  // /#work, where no navigation happens to close it for us.
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  // Reset state if the viewport grows past the md breakpoint while open.
  var desktop = window.matchMedia('(min-width: 768px)');
  var onChange = function (e) {
    if (e.matches) setOpen(false);
  };
  if (desktop.addEventListener) desktop.addEventListener('change', onChange);
  else desktop.addListener(onChange);
})();
