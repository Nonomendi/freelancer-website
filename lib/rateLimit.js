/**
 * In-memory per-IP rate limiting.
 *
 * CAVEAT — this is best-effort on Vercel. Each serverless instance keeps its
 * own Map, and instances are created and destroyed freely, so a determined
 * attacker spread across cold starts gets more than `max` requests. It stops
 * ordinary abuse (a stuck retry loop, someone hammering the chat widget) but
 * it is not a security control. Moving to Upstash Redis or similar would make
 * it exact; that needs an account, so it is not wired up here.
 */

/**
 * @param {{ windowMs: number, max: number, name: string }} options
 */
function createRateLimiter({ windowMs, max, name }) {
  /** @type {Map<string, number[]>} ip -> timestamps within the window */
  const hits = new Map();
  let lastSweep = Date.now();

  function sweep(now) {
    // Amortised cleanup so the Map cannot grow without bound on a
    // long-running host.
    if (now - lastSweep < windowMs) return;
    lastSweep = now;
    for (const [ip, times] of hits) {
      const live = times.filter((t) => now - t < windowMs);
      if (live.length) hits.set(ip, live);
      else hits.delete(ip);
    }
  }

  return {
    name,
    /**
     * Records a hit and reports whether it is allowed.
     * @returns {{ allowed: boolean, remaining: number, retryAfterSeconds: number }}
     */
    check(ip) {
      const now = Date.now();
      sweep(now);

      const times = (hits.get(ip) || []).filter((t) => now - t < windowMs);

      if (times.length >= max) {
        const oldest = times[0];
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
        };
      }

      times.push(now);
      hits.set(ip, times);
      return { allowed: true, remaining: max - times.length, retryAfterSeconds: 0 };
    }
  };
}

/**
 * Real client IP behind Vercel's proxy. `req.ip` alone would be the edge
 * node, which would rate limit every visitor as one person.
 */
function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  const real = req.headers['x-real-ip'];
  if (real) return String(real).trim();
  const ip = req.ip || (req.socket && req.socket.remoteAddress);
  if (!ip) return '0.0.0.0';
  return ip === '::1' ? '127.0.0.1' : ip;
}

module.exports = { createRateLimiter, clientIp };
