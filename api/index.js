/**
 * Vercel serverless entrypoint. Every request is rewritten here by
 * vercel.json except static files under /public.
 */
module.exports = require('../app');
