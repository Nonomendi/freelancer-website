const express = require('express');
const site = require('../config/site');

const router = express.Router();

/**
 * Pages worth indexing. /contact/thanks is deliberately absent — it is
 * noindex and would be meaningless in search results.
 */
const PAGES = [
  { path: '/', changefreq: 'monthly', priority: '1.0' },
  { path: '/services', changefreq: 'monthly', priority: '0.9' },
  { path: '/contact', changefreq: 'yearly', priority: '0.8' }
];

router.get('/sitemap.xml', (req, res) => {
  const lastmod = new Date().toISOString().split('T')[0];

  const urls = PAGES.map(
    (page) => `  <url>
    <loc>${site.baseUrl}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  ).join('\n');

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
});

router.get('/robots.txt', (req, res) => {
  // The API and the thank-you page have nothing to offer a crawler.
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /contact/thanks

Sitemap: ${site.baseUrl}/sitemap.xml
`);
});

module.exports = router;
