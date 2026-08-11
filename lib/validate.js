/**
 * Server-side validation for the quote form.
 *
 * The browser does its own checking for UX, but nothing here trusts it —
 * every rule below runs again on the server against the raw request body.
 */

const { findTier, tiers } = require('../config/pricing');

const LIMITS = {
  name: { min: 2, max: 80 },
  business: { max: 120 },
  email: { max: 254 },
  phone: { max: 30 },
  notes: { max: 2000 }
};

// Deliberately permissive. Real address validation is a delivery attempt,
// not a regex; this only catches obvious typos and junk.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// SA numbers arrive as 060 539 6226, 0605396226, +27 60 539 6226, etc.
const PHONE_RE = /^[+\d][\d\s()-]{5,}$/;

/** Minimum seconds between page render and submit. Below this it's a bot. */
const MIN_FILL_SECONDS = 3;
/** Above this the timestamp is stale (cached page, tab left open overnight). */
const MAX_FILL_SECONDS = 60 * 60 * 24;

function str(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * @returns {{ valid: boolean, errors: Object, values: Object, spam: string|null }}
 *   `spam` is set when the submission looks automated. Callers should treat
 *   it as a silent success — never tell a bot which check it tripped.
 */
function validateEnquiry(body = {}) {
  const values = {
    name: str(body.name),
    business: str(body.business),
    email: str(body.email),
    phone: str(body.phone),
    tier: str(body.tier),
    notes: str(body.notes)
  };

  const errors = {};

  if (!values.name) {
    errors.name = 'Please tell me your name.';
  } else if (values.name.length < LIMITS.name.min) {
    errors.name = 'That name looks too short.';
  } else if (values.name.length > LIMITS.name.max) {
    errors.name = `Please keep this under ${LIMITS.name.max} characters.`;
  }

  if (!values.email) {
    errors.email = 'I need an email address to reply to.';
  } else if (values.email.length > LIMITS.email.max || !EMAIL_RE.test(values.email)) {
    errors.email = 'That does not look like a valid email address.';
  }

  if (values.phone && (values.phone.length > LIMITS.phone.max || !PHONE_RE.test(values.phone))) {
    errors.phone = 'That does not look like a valid phone number.';
  }

  if (values.business.length > LIMITS.business.max) {
    errors.business = `Please keep this under ${LIMITS.business.max} characters.`;
  }

  if (!values.tier) {
    errors.tier = 'Please choose a package.';
  } else if (!findTier(values.tier)) {
    // Unknown slug: tampered request, or a tier we renamed. Either way the
    // visitor sees a normal message rather than a 400.
    errors.tier = 'Please choose one of the listed packages.';
    values.tier = tiers[0].slug;
  }

  if (values.notes.length > LIMITS.notes.max) {
    errors.notes = `Please keep this under ${LIMITS.notes.max} characters.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
    spam: detectSpam(body)
  };
}

/**
 * Bot checks kept separate from field validation: a tripped bot check
 * returns a success page, so it must never surface as a field error.
 */
function detectSpam(body) {
  // Honeypot. Named to look like a field a scraper would want to fill,
  // hidden from humans in CSS and from screen readers via aria-hidden.
  if (str(body.company_website)) return 'honeypot';

  const rendered = Number(body.form_started_at);
  if (!Number.isFinite(rendered)) return 'missing-timestamp';

  const elapsedSeconds = (Date.now() - rendered) / 1000;
  if (elapsedSeconds < MIN_FILL_SECONDS) return 'too-fast';
  if (elapsedSeconds > MAX_FILL_SECONDS) return 'stale-form';

  return null;
}

module.exports = { validateEnquiry, LIMITS, MIN_FILL_SECONDS };
