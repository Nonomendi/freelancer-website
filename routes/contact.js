const express = require('express');

const site = require('../config/site');
const { tiers, findTier } = require('../config/pricing');
const { validateEnquiry } = require('../lib/validate');
const { createRateLimiter, clientIp } = require('../lib/rateLimit');
const { saveEnquiry } = require('../lib/storage');
const { headerSafe } = require('../lib/html');
const { sendMail } = require('../lib/mailer');
const { enquiryNotification, enquiryAcknowledgement } = require('../lib/mailer/templates');

const router = express.Router();

// Five enquiries per IP per hour. Generous for a person, tight for a script.
const limiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  name: 'contact'
});

/** The form is submitted by fetch() when JS is available, and natively when not. */
function wantsJson(req) {
  return req.get('X-Requested-With') === 'fetch';
}

function renderForm(res, status, { values, errors, formError }) {
  return res.status(status).render('pages/contact', {
    title: 'Contact & Instant Quote | Nolundi.dev',
    description:
      'Request a quote from Nolundi Mendi. Send project details directly or start a WhatsApp chat.',
    activeNav: 'contact',
    tiers,
    selectedTier: values.tier || tiers[0].slug,
    values,
    errors,
    formError
  });
}

router.post('/contact', async (req, res, next) => {
  try {
    const ip = clientIp(req);
    const { valid, errors, values, spam } = validateEnquiry(req.body);

    /* --- Bots -------------------------------------------------------------
     * Honeypot filled, or submitted implausibly fast. Return the ordinary
     * success response: telling a bot it was detected just teaches it. */
    if (spam) {
      console.log(`[contact] dropped submission from ${ip} (${spam})`);
      return wantsJson(req)
        ? res.json({ ok: true, redirect: '/contact/thanks' })
        : res.redirect(303, '/contact/thanks');
    }

    /* --- Field validation ------------------------------------------------ */
    if (!valid) {
      return wantsJson(req)
        ? res.status(422).json({ ok: false, errors })
        : renderForm(res, 422, {
            values,
            errors,
            formError: 'Please correct the highlighted fields and try again.'
          });
    }

    /* --- Rate limit -------------------------------------------------------
     * Checked after validation so a visitor fixing a typo three times does
     * not burn their allowance on submissions that were never accepted. */
    const limit = limiter.check(ip);
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSeconds / 60);
      const message = `That's a few enquiries in a short space of time. Please try again in about ${minutes} minute${
        minutes === 1 ? '' : 's'
      }, or reach me on WhatsApp.`;

      res.set('Retry-After', String(limit.retryAfterSeconds));
      return wantsJson(req)
        ? res.status(429).json({ ok: false, formError: message })
        : renderForm(res, 429, { values, errors: {}, formError: message });
    }

    /* --- Record first -----------------------------------------------------
     * Logged before the email attempt so a mail outage still leaves a
     * record of who tried to get in touch. */
    const enquiry = await saveEnquiry({
      values,
      ip,
      userAgent: req.get('user-agent')
    });

    /* --- Notify Nolundi ---------------------------------------------------
     * This one is the enquiry actually arriving. If it fails, the visitor
     * is told, and pointed at WhatsApp. */
    const tier = findTier(values.tier);
    const notification = await sendMail({
      to: process.env.ENQUIRY_RECIPIENT || site.email,
      displayName: 'Nolundi.dev Website',
      subject: headerSafe(
        `New enquiry — ${values.name}${values.business ? ` (${values.business})` : ''} — ${
          tier ? tier.number : values.tier
        }`
      ),
      html: enquiryNotification(enquiry)
    });

    if (!notification.ok) {
      console.error(`[contact] notification failed for ${enquiry.id}:`, notification.error);
      const message =
        "Your details were saved, but the email didn't go through on my side. Please send them on WhatsApp so nothing gets lost.";
      return wantsJson(req)
        ? res.status(502).json({ ok: false, formError: message, whatsappFallback: true })
        : renderForm(res, 502, { values, errors: {}, formError: message });
    }

    /* --- Acknowledge the visitor ------------------------------------------
     * Best effort. A failure here is logged but must not turn a received
     * enquiry into an error page. */
    const acknowledgement = await sendMail({
      to: values.email,
      displayName: site.name,
      subject: 'Thanks — I have your enquiry',
      html: enquiryAcknowledgement(enquiry)
    });

    if (!acknowledgement.ok) {
      console.error(
        `[contact] acknowledgement to ${values.email} failed for ${enquiry.id}:`,
        acknowledgement.error
      );
    }

    console.log(`[contact] enquiry ${enquiry.id} accepted from ${ip}`);

    // POST/redirect/GET so a refresh on the thank-you page does not resubmit.
    return wantsJson(req)
      ? res.json({ ok: true, redirect: '/contact/thanks' })
      : res.redirect(303, '/contact/thanks');
  } catch (err) {
    return next(err);
  }
});

router.get('/contact/thanks', (req, res) => {
  res.render('pages/contact-success', {
    title: 'Enquiry received | Nolundi.dev',
    description: 'Your enquiry has been received.',
    activeNav: 'contact',
    noindex: true
  });
});

module.exports = router;
