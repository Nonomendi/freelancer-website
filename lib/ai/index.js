/**
 * AI provider interface.
 *
 * A provider exposes:
 *   name           string
 *   isConfigured() boolean
 *   complete(messages, systemPrompt)         -> { ok, text?, error? }
 *   stream(messages, systemPrompt, onText)   -> { ok, error?, partial? }
 *
 * `messages` is [{ role: 'user' | 'assistant', content: string }] — a
 * provider-neutral shape. The adapter translates it (Gemini, for instance,
 * calls the assistant role "model").
 *
 * To swap providers, add a module here and set AI_PROVIDER.
 */

const providers = {
  gemini: require('./gemini')
};

function getProvider() {
  const name = process.env.AI_PROVIDER || 'gemini';
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unknown AI_PROVIDER "${name}". Available: ${Object.keys(providers).join(', ')}`
    );
  }
  return provider;
}

function isAiConfigured() {
  try {
    return getProvider().isConfigured();
  } catch {
    return false;
  }
}

module.exports = { getProvider, isAiConfigured };
