const express = require('express');
const site = require('../config/site');
const { serviceGroups, tiers, process: steps, portfolio, findTier } = require('../config/pricing');
const { faqs, testimonials, testimonialsArePlaceholder } = require('../config/content');

const router = express.Router();

/* ---------------------------------------------------------------------------
 * Legacy .html URLs -> clean paths. 301 so search engines and any link
 * already in the wild follow permanently.
 * ------------------------------------------------------------------------ */
const LEGACY_REDIRECTS = {
  '/index.html': '/',
  '/services.html': '/services',
  '/contact.html': '/contact'
};

Object.entries(LEGACY_REDIRECTS).forEach(([from, to]) => {
  router.get(from, (req, res) => {
    const qs = req.originalUrl.includes('?')
      ? '?' + req.originalUrl.split('?').slice(1).join('?')
      : '';
    res.redirect(301, to + qs);
  });
});

/* --------------------------------------------------------------------------- */

router.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Nolundi Mendi | Full Stack & Salesforce Developer',
    description:
      'Nolundi Mendi | Full Stack (React, Java, Python) & Salesforce (Apex, LWC) Developer in Johannesburg. Build apps, websites, Salesforce customization. Freelance services.',
    activeNav: 'home',
    serviceGroups,
    steps,
    portfolio,
    faqs,
    testimonials,
    testimonialsArePlaceholder
  });
});

router.get('/services', (req, res) => {
  res.render('pages/services', {
    title: 'Services & Pricing | Nolundi.dev',
    description:
      'Clear packages designed for local small businesses, growing companies, and Salesforce projects. Transparent pricing from a Johannesburg-based developer.',
    activeNav: 'services',
    tiers
  });
});

router.get('/contact', (req, res) => {
  // ?tier= carries a stable slug (tier-01). Fall back to the first tier if
  // the slug is missing or unrecognised.
  const requested = findTier(req.query.tier);

  res.render('pages/contact', {
    title: 'Contact & Instant Quote | Nolundi.dev',
    description:
      'Request a quote from Nolundi Mendi. Send project details directly or start a WhatsApp chat.',
    activeNav: 'contact',
    tiers,
    selectedTier: requested ? requested.slug : tiers[0].slug,
    values: {},
    errors: {},
    formError: null
  });
});

module.exports = router;
