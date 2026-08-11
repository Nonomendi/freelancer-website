/**
 * Google Gemini adapter.
 *
 * Endpoint and payload shape verified against ai.google.dev in August 2026:
 *   POST {API_BASE}/models/{model}:generateContent
 *   POST {API_BASE}/models/{model}:streamGenerateContent?alt=sse
 *   header: x-goog-api-key
 *   body:   { contents: [{ role, parts: [{ text }] }],
 *             systemInstruction: { parts: [{ text }] },
 *             generationConfig: { maxOutputTokens, temperature } }
 *
 * Roles are "user" and "model" — not "assistant". The key never leaves the
 * server; the browser talks only to POST /api/chat.
 */

const { MODEL, API_BASE, LIMITS } = require('../../config/chat');

const REQUEST_TIMEOUT_MS = 30000;

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function buildBody(messages, systemPrompt) {
  return {
    contents: messages.map((m) => ({
      // Our transport calls it "assistant"; Gemini calls it "model".
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: LIMITS.maxOutputTokens,
      temperature: LIMITS.temperature,
      // Reasoning tokens are drawn from maxOutputTokens on thinking models.
      // Without this, thinking eats the budget and replies get cut off.
      //
      // The field path matters and is easy to get wrong: on this endpoint it
      // is generationConfig.thinkingConfig.thinkingLevel. A bare
      // `thinkingLevel`, the snake_case `thinking_level` from the newer API
      // surface's docs, and `thinkingConfig.thinkingBudget: 0` are all
      // rejected here. Verified empirically in August 2026.
      thinkingConfig: { thinkingLevel: LIMITS.thinkingLevel }
    }
  };
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.GEMINI_API_KEY
  };
}

/** Pull the text out of a candidate, tolerating chunks that carry none. */
function extractText(payload) {
  const parts =
    payload &&
    payload.candidates &&
    payload.candidates[0] &&
    payload.candidates[0].content &&
    payload.candidates[0].content.parts;

  if (!Array.isArray(parts)) return '';
  return parts.map((p) => (typeof p.text === 'string' ? p.text : '')).join('');
}

/** Non-streaming. Used as the fallback when streaming is unavailable. */
async function complete(messages, systemPrompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(buildBody(messages, systemPrompt)),
      signal: controller.signal
    });

    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `gemini ${res.status}: ${detail.slice(0, 300)}`, status: res.status };
    }

    const payload = await res.json();

    // A blocked prompt returns 200 with no candidate text.
    const blocked = payload.promptFeedback && payload.promptFeedback.blockReason;
    if (blocked) return { ok: false, error: `gemini blocked the prompt: ${blocked}` };

    const text = extractText(payload);
    if (!text) return { ok: false, error: 'gemini returned an empty response' };

    return { ok: true, text };
  } catch (err) {
    const reason = err.name === 'AbortError' ? `timed out after ${REQUEST_TIMEOUT_MS}ms` : err.message;
    return { ok: false, error: `gemini request failed: ${reason}` };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Streaming. Calls onText(chunk) as text arrives.
 * Resolves { ok: true } once the stream ends cleanly.
 *
 * If the request fails BEFORE any text is emitted, resolves { ok: false }
 * so the caller can still send a clean error. If it fails midway, the
 * partial text has already been delivered and `partial: true` says so.
 */
async function stream(messages, systemPrompt, onText) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let emitted = false;

  try {
    const res = await fetch(`${API_BASE}/models/${MODEL}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(buildBody(messages, systemPrompt)),
      signal: controller.signal
    });

    if (!res.ok || !res.body) {
      const detail = res.body ? await res.text() : '';
      return {
        ok: false,
        error: `gemini ${res.status}: ${detail.slice(0, 300)}`,
        status: res.status,
        partial: false
      };
    }

    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });

      // SSE frames are separated by a blank line; a frame may span chunks.
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() || '';

      for (const frame of frames) {
        for (const line of frame.split(/\r?\n/)) {
          if (!line.startsWith('data:')) continue;

          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;

          let payload;
          try {
            payload = JSON.parse(data);
          } catch {
            continue; // Ignore anything that is not a JSON frame.
          }

          // Reasoning models send a final frame with no text part.
          const text = extractText(payload);
          if (text) {
            emitted = true;
            onText(text);
          }
        }
      }
    }

    if (!emitted) return { ok: false, error: 'gemini stream produced no text', partial: false };
    return { ok: true };
  } catch (err) {
    const reason = err.name === 'AbortError' ? `timed out after ${REQUEST_TIMEOUT_MS}ms` : err.message;
    return { ok: false, error: `gemini stream failed: ${reason}`, partial: emitted };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { name: 'gemini', isConfigured, complete, stream };
