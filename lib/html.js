/** Escape a string for safe interpolation into HTML email bodies. */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape, then turn newlines into <br> so multi-line notes keep shape. */
function escapeMultiline(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

/**
 * Make a visitor-supplied string safe to place in an email subject.
 *
 * Subjects are headers, not HTML — the risk here is not <script> but a CR or
 * LF letting someone append their own headers (Bcc:, Content-Type:) if the
 * upstream mail service concatenates naively. Replace every control
 * character with a space, collapse whitespace, and cap the length.
 *
 * Written as a codepoint filter rather than a regex character class so no
 * literal control characters have to live in this source file.
 */
function headerSafe(value, maxLength = 120) {
  const raw = String(value === null || value === undefined ? '' : value);

  const stripped = Array.from(raw)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code < 0x20 || code === 0x7f ? ' ' : ch;
    })
    .join('');

  const cleaned = stripped.replace(/\s+/g, ' ').trim();

  return cleaned.length > maxLength ? cleaned.slice(0, maxLength - 1) + '…' : cleaned;
}

module.exports = { escapeHtml, escapeMultiline, headerSafe };
