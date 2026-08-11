const express = require('express');

const { LIMITS, buildSystemPrompt, fallbackMessage, busyMessage } = require('../config/chat');
const { getProvider, isAiConfigured } = require('../lib/ai');
const { createRateLimiter, clientIp } = require('../lib/rateLimit');

const router = express.Router();

const limiter = createRateLimiter({
  windowMs: LIMITS.rateLimit.windowMs,
  max: LIMITS.rateLimit.max,
  name: 'chat'
});

// Built once at boot rather than per request — it is derived from static
// config and is a few thousand characters.
const SYSTEM_PROMPT = buildSystemPrompt();

/**
 * Validate the conversation sent by the browser.
 *
 * History lives in the visitor's tab, which means they can edit it. Nothing
 * here trusts it: roles, types and lengths are all checked, and the whole
 * thing is capped so nobody can paste a novel and bill it to Nolundi.
 */
function parseConversation(body) {
  if (!body || !Array.isArray(body.messages)) {
    return { error: 'Expected a messages array.' };
  }

  if (body.messages.length === 0) {
    return { error: 'No message to answer.' };
  }

  if (body.messages.length > LIMITS.maxHistoryMessages) {
    return {
      error: `This conversation has got long. Please start a new one, or contact Nolundi directly.`,
      status: 413
    };
  }

  const messages = [];
  for (const raw of body.messages) {
    if (!raw || typeof raw.content !== 'string') {
      return { error: 'Malformed message.' };
    }

    const role = raw.role === 'assistant' ? 'assistant' : 'user';
    const content = raw.content.trim();

    if (!content) return { error: 'Empty message.' };
    if (content.length > LIMITS.maxMessageLength) {
      return {
        error: `Please keep messages under ${LIMITS.maxMessageLength} characters.`,
        status: 413
      };
    }

    messages.push({ role, content });
  }

  // Gemini expects the conversation to end with the visitor's turn.
  if (messages[messages.length - 1].role !== 'user') {
    return { error: 'The last message must be from the visitor.' };
  }

  return { messages };
}

router.post('/api/chat', async (req, res) => {
  const ip = clientIp(req);

  /* --- Key missing -------------------------------------------------------
   * Not an error the visitor caused. Return 200 with the fallback text so
   * the widget shows Nolundi's contact details instead of breaking. */
  if (!isAiConfigured()) {
    console.warn('[chat] no API key configured — serving fallback');
    return res.json({ ok: true, fallback: true, text: fallbackMessage() });
  }

  const limit = limiter.check(ip);
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    res.set('Retry-After', String(limit.retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      text: `That's a lot of questions in a short time. Please try again in about ${minutes} minute${
        minutes === 1 ? '' : 's'
      } — or just message Nolundi directly, which is faster anyway.`
    });
  }

  const parsed = parseConversation(req.body);
  if (parsed.error) {
    return res.status(parsed.status || 400).json({ ok: false, text: parsed.error });
  }

  const provider = getProvider();
  const wantsStream = req.query.stream !== '0';

  /* --- Non-streaming ---------------------------------------------------- */
  if (!wantsStream) {
    const result = await provider.complete(parsed.messages, SYSTEM_PROMPT);
    if (!result.ok) {
      console.error('[chat]', result.error);
      return res.json({
        ok: true,
        fallback: true,
        text: result.status === 429 ? busyMessage() : fallbackMessage()
      });
    }
    return res.json({ ok: true, text: result.text });
  }

  /* --- Streaming ---------------------------------------------------------
   * Our own SSE envelope rather than a passthrough of Gemini's, so the
   * browser never sees provider-specific shapes and swapping provider does
   * not change the client. */
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Vercel and most proxies buffer responses unless told not to.
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();

  // Must be res, not req: an IncomingMessage emits 'close' as soon as its
  // body has been consumed, which for a small JSON POST is immediately —
  // that would suppress every frame and stream an empty response.
  let clientGone = false;
  res.on('close', () => {
    clientGone = true;
  });

  const send = (event, data) => {
    if (clientGone) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const result = await provider.stream(parsed.messages, SYSTEM_PROMPT, (text) => {
    send('delta', { text });
  });

  if (!result.ok) {
    console.error('[chat]', result.error);
    if (result.partial) {
      // Some text already reached the visitor; don't overwrite it, just say
      // the answer was cut short.
      send('error', { text: "…sorry, that got cut off. Ask again, or message Nolundi directly." });
    } else {
      send('fallback', { text: result.status === 429 ? busyMessage() : fallbackMessage() });
    }
  }

  send('done', {});
  res.end();
});

module.exports = router;
