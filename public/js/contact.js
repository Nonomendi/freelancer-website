/* Progressive enhancement for the quote form.
   Without this script the form still posts natively to POST /contact and the
   server renders errors or redirects. This layer adds inline errors without a
   page reload, a disabled submit button, and a WhatsApp fallback on failure. */
(function () {
  'use strict';

  var form = document.getElementById('quoteForm');
  if (!form) return;

  var submit = document.getElementById('quoteSubmit');
  var idle = document.getElementById('quoteSubmitIdle');
  var busy = document.getElementById('quoteSubmitBusy');
  var status = document.getElementById('quoteStatus');
  var formError = document.getElementById('formError');
  var formErrorText = document.getElementById('formErrorText');
  var formErrorWhatsapp = document.getElementById('formErrorWhatsapp');

  var FIELDS = {
    name: 'clientName',
    business: 'businessName',
    email: 'clientEmail',
    phone: 'clientPhone',
    tier: 'packageTier',
    notes: 'projectNotes'
  };

  var ERROR_CLASSES = ['border-red-400', 'bg-red-50', 'focus:ring-red-400'];

  function setBusy(isBusy) {
    submit.disabled = isBusy;
    idle.classList.toggle('hidden', isBusy);
    idle.classList.toggle('flex', !isBusy);
    busy.classList.toggle('hidden', !isBusy);
    busy.classList.toggle('flex', isBusy);
    status.textContent = isBusy ? 'Sending your enquiry…' : '';
  }

  function clearErrors() {
    Object.keys(FIELDS).forEach(function (key) {
      var input = document.getElementById(FIELDS[key]);
      var message = document.getElementById('err-' + key);
      if (input) {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        input.classList.remove.apply(input.classList, ERROR_CLASSES);
        input.classList.add('border-slate-200');
      }
      if (message) {
        message.textContent = '';
        message.classList.add('hidden');
      }
    });
    formError.classList.add('hidden');
  }

  function showFieldErrors(errors) {
    var firstInput = null;

    Object.keys(errors).forEach(function (key) {
      var input = document.getElementById(FIELDS[key]);
      var message = document.getElementById('err-' + key);
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', 'err-' + key);
        input.classList.remove('border-slate-200');
        input.classList.add.apply(input.classList, ERROR_CLASSES);
        if (!firstInput) firstInput = input;
      }
      if (message) {
        message.textContent = errors[key];
        message.classList.remove('hidden');
      }
    });

    if (firstInput) firstInput.focus();
  }

  /* `takeFocus` is false when individual fields are also flagged: the first
     invalid field is the more useful landing spot, and the banner is still
     announced because it is role="alert". */
  function showFormError(message, offerWhatsapp, takeFocus) {
    formErrorText.textContent = message;
    formErrorWhatsapp.classList.toggle('hidden', !offerWhatsapp);
    formError.classList.remove('hidden');
    if (takeFocus !== false) formError.focus();
  }

  /** Pre-fills the WhatsApp fallback with whatever is already typed in. */
  function buildWhatsappMessage() {
    var tier = document.getElementById('packageTier');
    var parts = [
      'Hi Nolundi! 👋',
      '',
      'I would like to request a project quote:',
      ''
    ];

    var name = document.getElementById('clientName').value.trim();
    var business = document.getElementById('businessName').value.trim();
    var email = document.getElementById('clientEmail').value.trim();
    var notes = document.getElementById('projectNotes').value.trim();

    if (name) parts.push('• Name: ' + name);
    if (business) parts.push('• Business: ' + business);
    if (email) parts.push('• Email: ' + email);
    parts.push('• Package: ' + tier.options[tier.selectedIndex].text);
    if (notes) parts.push('• Details: ' + notes);

    return parts.join('\n');
  }

  function refreshWhatsappLinks() {
    var href =
      'https://wa.me/' + form.dataset.whatsapp + '?text=' + encodeURIComponent(buildWhatsappMessage());
    var fallback = document.getElementById('whatsappFallback');
    if (fallback) fallback.href = href;
    if (formErrorWhatsapp) formErrorWhatsapp.href = href;
  }

  form.addEventListener('input', refreshWhatsappLinks);
  form.addEventListener('change', refreshWhatsappLinks);
  refreshWhatsappLinks();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();
    setBusy(true);

    fetch('/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch'
      },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.data && result.data.ok) {
          status.textContent = 'Enquiry sent.';
          window.location.assign(result.data.redirect || '/contact/thanks');
          return; // leave the button disabled while navigating away
        }

        setBusy(false);

        if (result.data && result.data.errors) {
          // Banner first so it is in the DOM, then move focus to the field.
          showFormError('Please correct the highlighted fields and try again.', false, false);
          showFieldErrors(result.data.errors);
          return;
        }

        showFormError(
          (result.data && result.data.formError) ||
            "That didn't go through. Please try again in a moment.",
          true,
          true
        );
      })
      .catch(function () {
        // Network failure, offline, blocked request — the visitor still needs
        // a way to reach Nolundi.
        setBusy(false);
        showFormError(
          "I couldn't reach the server — you may be offline. Your details are still in the form, so nothing is lost.",
          true,
          true
        );
      });
  });
})();
