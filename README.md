# Nolundi.dev

Freelance developer site for **Nolundi Mendi** — Full-Stack & Salesforce Developer, Johannesburg.

Node.js + Express + EJS, Tailwind compiled at build time, a server-side contact form that
emails enquiries, and an AI assistant that answers visitor questions about services and pricing.

---

## Quick start

```bash
npm install
```

Copy the example environment file and fill it in:

```bash
cp .env.example .env
```

Then run both the Tailwind watcher and the server:

```bash
npm run dev
```

The site is at **http://localhost:3000**.

> The app runs without any environment variables set. The contact form will report a delivery
> failure (and offer WhatsApp instead), and the chat widget will reply with Nolundi's contact
> details. Nothing crashes — see [Degraded behaviour](#degraded-behaviour).

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Tailwind watcher + auto-restarting server |
| `npm run dev:server` | Server only |
| `npm run dev:css` | Tailwind watcher only |
| `npm run build` | One-off minified CSS build (this is what Vercel runs) |
| `npm start` | Production server, no watcher |

`public/css/style.css` is generated and gitignored. If the site renders unstyled, you have not
run a CSS build.

---

## Environment variables

All secrets live in `.env`, which is gitignored. `.env.example` is committed and lists every
variable. **Never commit a real key.**

| Variable | Required | Purpose |
|---|---|---|
| `BASE_URL` | Production | Public site URL, no trailing slash. Drives canonical tags, Open Graph URLs and `sitemap.xml`. Falls back to `http://localhost:3000`. |
| `PORT` | No | Defaults to `3000`. |
| `NODE_ENV` | No | Set to `production` on the live site to enable static-asset caching. |
| `EMAIL_API_URL` | Contact form | Nolundi's transactional email endpoint. |
| `EMAIL_API_KEY` | Contact form | Sent as the `X-API-Key` header. |
| `ENQUIRY_RECIPIENT` | No | Where enquiries are delivered. Defaults to the address in `config/site.js`. |
| `GEMINI_API_KEY` | Chat | Google AI Studio key — https://aistudio.google.com/apikey. Free tier, no card. |
| `AI_PROVIDER` | No | Defaults to `gemini`. |
| `EMAIL_PROVIDER` | No | Defaults to `nolundiApi`. |
| `ENQUIRY_STORAGE` | No | `jsonFile` or `console`. Auto-selected if unset — see [Enquiry log](#enquiry-log). |
| `GEMINI_API_BASE` | No | Override the Gemini endpoint. For pointing at a stub in tests. |

---

## Changing prices

**Every price on the site lives in [`config/pricing.js`](config/pricing.js).** Nothing else.

Edit it and the change propagates to:

- the homepage service cards
- the services page tiers
- the contact form's package dropdown
- **the AI assistant's system prompt** — it is generated from this file, not copied, so the
  assistant quotes the new figure on the next message with no other edit

Prices are stored as display strings (`'R1,990 – R3,500'`, `'R35,000+'`) because they are ranges
and must render exactly as written. Do not convert them to numbers.

One exception to watch: the FAQ answers in [`config/content.js`](config/content.js) that quote
figures are plain prose and **do not** update automatically. They are marked with comments.

### Tier slugs

Each tier has a `slug` (`tier-01`, `tier-02`, `tier-03`). These are the values used by the contact
form's `<select>` and the `?tier=` link from the services page. **Never change a live slug** —
change `optionLabel` instead, which is the human-readable text.

---

## Changing what the chatbot knows

Two files:

**[`config/pricing.js`](config/pricing.js)** — the facts. Services, prices, tiers, turnaround
times, process steps. All fed into the system prompt automatically.

**[`config/chat.js`](config/chat.js)** — the behaviour:

- `MODEL` — the Gemini model ID, in one place.
- `RULES` — the system prompt's instructions: scope, tone, and the hard rules (never invent a
  price, never promise a deadline, never agree to a discount, never accept a booking).
- `GREETING` / `SUGGESTIONS` — the opening message and the suggested-question chips.
- `LIMITS` — rate limit, conversation cap, message length, token budget.
- `fallbackMessage()` / `busyMessage()` — what the widget says when the API is unavailable.

After editing `RULES`, re-test the guardrails. Ask it for a discount, ask it to promise a
delivery date, and ask it something off-topic. It should refuse all three and point at the
contact form.

### About the model ID

`MODEL` is currently `gemini-3.6-flash`. **Check
https://ai.google.dev/gemini-api/docs/models before changing it** — model strings go stale, and
older names that look familiar (`gemini-2.0-flash`, `gemini-3-pro-preview`) have been shut down.

`LIMITS.thinkingLevel` is set to `'minimal'` for a reason: this is a thinking model and its
reasoning tokens are drawn from `maxOutputTokens`. Without it, replies get truncated
mid-sentence. The config field path is fussy and is documented at the call site in
[`lib/ai/gemini.js`](lib/ai/gemini.js).

---

## Changing contact details

[`config/site.js`](config/site.js) holds the name, role, location, email, WhatsApp number and
navigation labels. The WhatsApp number is stored **once**, in international format with no
leading zero (`27605396226`), and every link is built from it via `whatsappLink()`.

`site.trust.responseTime` is `null` by default and renders nothing. Set it to a string you can
actually honour (e.g. `'Replies within one business day'`) and it appears next to every
call to action.

---

## Testimonials

[`config/content.js`](config/content.js). Every entry currently has `placeholder: true`, which
renders the section greyed out, dashed, and with a visible amber warning banner.

Replace the quotes with real ones you have permission to publish and set `placeholder: false`.
The warning disappears automatically. If you have fewer than three, delete the spare entries
rather than leaving placeholders live.

To remove the section entirely, delete the `include('../partials/testimonials')` line at the
bottom of [`views/pages/home.ejs`](views/pages/home.ejs).

---

## Deploying to Vercel

`vercel.json` is committed. Vercel runs `npm run build:css`, serves `public/` statically, and
routes everything else to `api/index.js`, which exports the same Express app as `server.js`.

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from `.env.example` under **Settings → Environment Variables**.
3. Set `BASE_URL` to the real domain — canonical tags, Open Graph and `sitemap.xml` all use it.
4. Set `NODE_ENV=production`.

`includeFiles: "views/**"` in `vercel.json` is what keeps the EJS templates in the function
bundle. Removing it produces a "template not found" error at runtime.

### Vercel's trade-offs

Vercel was chosen deliberately, with two known costs:

**The JSON enquiry log does not work there.** The filesystem is read-only apart from `/tmp`,
which is wiped between invocations. On Vercel the storage driver switches to `console`, writing
one structured JSON line per enquiry to the log stream. The email is the durable record. To fix
properly, add a database driver — see [Enquiry log](#enquiry-log).

**Rate limiting is best-effort.** Counters are per serverless instance and reset on cold starts,
so the per-IP limits on the contact form and chat API are not exact. They stop ordinary abuse,
not a determined attacker. An external store (Upstash Redis or similar) would make them precise.

Neither is a problem at low traffic. Both are documented in the code where they apply.

---

## Architecture

```
app.js            Express wiring; shared by server.js (local) and api/index.js (Vercel)
config/
  site.js         Identity, contact details, nav, trust signals
  pricing.js      Every price, tier, process step, portfolio entry
  content.js      FAQ and testimonials
  chat.js         AI model, limits, and system prompt builder
routes/
  pages.js        /  /services  /contact  + 301s from the old .html URLs
  contact.js      POST /contact, GET /contact/thanks
  chat.js         POST /api/chat
  seo.js          /sitemap.xml, /robots.txt
lib/
  mailer/         Email provider interface + Nolundi's API adapter + templates
  ai/             AI provider interface + Gemini adapter
  storage.js      Enquiry log, driver-based
  validate.js     Server-side form validation and spam detection
  rateLimit.js    Per-IP limiting, and real client IP behind a proxy
  html.js         Escaping for email bodies and subject headers
views/
  layout.ejs      Wraps every page
  partials/       header, footer, meta, icon, chat-widget, faq, testimonials, trust
  pages/          home, services, contact, contact-success, 404, 500
public/js/        nav, reveal, contact, chat — all plain, all deferred
```

### Swapping providers

Both the mailer and the AI client sit behind small interfaces. To swap either, add a module
next to the existing adapter and point the corresponding env var at it:

- Email: implement `isConfigured()` and `send({ to, subject, html, displayName })`, register it
  in [`lib/mailer/index.js`](lib/mailer/index.js), set `EMAIL_PROVIDER`.
- AI: implement `isConfigured()`, `complete()` and `stream()`, register it in
  [`lib/ai/index.js`](lib/ai/index.js), set `AI_PROVIDER`.

### Enquiry log

[`lib/storage.js`](lib/storage.js) has two drivers behind one `saveEnquiry()` call:
`jsonFile` (writes `data/enquiries.json`, used locally) and `console` (used on Vercel).

To add a database, implement a third driver with a `save(enquiry)` method and select it in
`resolveDriver()`. Nothing in `routes/contact.js` needs to change.

`data/enquiries.json` is gitignored — it contains visitor personal data.

### Spam protection

The contact form uses three layers, all server-side: a honeypot field, a minimum fill time, and
a per-IP rate limit. A submission that trips a bot check gets the **normal success response** —
telling a bot which check it failed only helps it. No CAPTCHA, by design.

### Degraded behaviour

Nothing here breaks when a dependency is missing:

| Missing | What happens |
|---|---|
| `EMAIL_API_KEY` | Enquiry is still logged. Visitor sees a clear failure with a WhatsApp fallback link pre-filled with what they typed. |
| `GEMINI_API_KEY` | Widget loads and replies with Nolundi's phone and email. |
| Gemini returns 429 | "Busy, try again in a moment" — distinct from a real outage. |
| JavaScript disabled | Contact form posts natively and redirects; nav is a plain list; all content is visible. |
| IntersectionObserver unavailable | Scroll animations are skipped; content shows immediately. |

---

## Accessibility & performance notes

- Semantic landmarks, one `<h1>` per page, no skipped heading levels, skip link, labelled form
  fields, `aria-live` regions for form and chat status.
- All colour pairs in use pass WCAG AA for normal text (lowest 4.76:1).
- `prefers-reduced-motion` is respected in both JS and CSS.
- Icons are inline SVG ([`views/partials/icon.ejs`](views/partials/icon.ejs)) — no icon font, no
  third-party stylesheet. They are drawn in-house, so no icon-library licence applies. The brand
  marks are simplified shapes, not official trademarks; swap in official SVGs if you prefer.
- The profile photo is served as AVIF/WebP/JPEG at 1x and 2x with explicit dimensions.
- Only Google Fonts remains as a third-party origin, with `preconnect`.
- All page JavaScript is `defer`red; none of it blocks rendering.

---

## Known issues

**Portfolio demos are behind a login wall.** All three "Launch Live Preview" links redirect to
`vercel.com/login` because those projects have Vercel Deployment Protection enabled. Visitors
cannot see them. Fix in each project: **Settings → Deployment Protection → Vercel Authentication
→ Disabled**.

**Portfolio URLs are deployment previews.** They contain build hashes and will break on redeploy.
Replace them with production URLs in `config/pricing.js`.

**Portfolio preview images are placeholders.** Real screenshots could not be captured while the
demos are behind the login wall. Replace `public/img/preview-*.svg` and set
`previewIsPlaceholder: false`.

**Testimonials are placeholders.** See above.

**`site.trust.responseTime` is unset**, so no response-time claim is displayed anywhere.
