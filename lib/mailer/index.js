/**
 * Mail provider interface.
 *
 * A provider is an object with:
 *   name          string
 *   isConfigured() boolean — false means required env vars are missing
 *   send({ to, subject, html, displayName }) -> { ok, error? }
 *
 * `send` must resolve, never reject: callers decide what a failure means.
 * To swap providers, add a module here and point EMAIL_PROVIDER at it.
 */

const providers = {
  nolundiApi: require('./nolundiApi')
};

function getProvider() {
  const name = process.env.EMAIL_PROVIDER || 'nolundiApi';
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unknown EMAIL_PROVIDER "${name}". Available: ${Object.keys(providers).join(', ')}`
    );
  }
  return provider;
}

async function sendMail({ to, subject, html, displayName }) {
  const provider = getProvider();

  if (!provider.isConfigured()) {
    return {
      ok: false,
      error: `email provider "${provider.name}" is not configured — check EMAIL_API_URL and EMAIL_API_KEY in .env`
    };
  }

  try {
    return await provider.send({ to, subject, html, displayName });
  } catch (err) {
    return { ok: false, error: `email provider "${provider.name}" threw: ${err.message}` };
  }
}

function isMailConfigured() {
  try {
    return getProvider().isConfigured();
  } catch {
    return false;
  }
}

module.exports = { sendMail, isMailConfigured };
