/**
 * Adapter for Nolundi's own transactional email endpoint.
 *
 * Expects:
 *   POST <EMAIL_API_URL>
 *   X-API-Key: <EMAIL_API_KEY>
 *   { "recipient-email": "a@b.com,c@d.com",
 *     "display-name": "...", "subject": "...",
 *     "content": "<html>", "html-content": true }
 *
 * EMAIL_API_URL lives in .env rather than in code: it currently points at a
 * Vercel branch deployment, which survives redeploys but not a project
 * rename or a move between team scopes.
 */

const TIMEOUT_MS = 10000;

module.exports = {
  name: 'nolundiApi',

  isConfigured() {
    return Boolean(process.env.EMAIL_API_URL && process.env.EMAIL_API_KEY);
  },

  async send({ to, subject, html, displayName }) {
    const url = process.env.EMAIL_API_URL;
    const key = process.env.EMAIL_API_KEY;

    // Abort rather than let a hanging endpoint hold the request open until
    // Vercel's function timeout kills the whole response.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': key
        },
        body: JSON.stringify({
          'recipient-email': Array.isArray(to) ? to.join(',') : to,
          'display-name': displayName,
          subject,
          content: html,
          'html-content': true
        }),
        signal: controller.signal
      });

      const body = await response.text();

      if (!response.ok) {
        return {
          ok: false,
          error: `email api responded ${response.status}: ${body.slice(0, 300)}`
        };
      }

      return { ok: true, response: body.slice(0, 300) };
    } catch (err) {
      const reason = err.name === 'AbortError' ? `timed out after ${TIMEOUT_MS}ms` : err.message;
      return { ok: false, error: `email api request failed: ${reason}` };
    } finally {
      clearTimeout(timer);
    }
  }
};
