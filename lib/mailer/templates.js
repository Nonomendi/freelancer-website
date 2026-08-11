/**
 * HTML email bodies. Inline styles only — mail clients strip <style> blocks
 * unpredictably, and Gmail ignores external stylesheets entirely.
 *
 * Every interpolated value goes through escapeHtml first. The visitor
 * controls name, business and notes, so unescaped output here would be an
 * HTML injection into Nolundi's inbox.
 */

const site = require('../../config/site');
const { findTier } = require('../../config/pricing');
const { escapeHtml, escapeMultiline } = require('../html');

const DARK = '#0F172A';
const PRIMARY = '#2563EB';
const ACCENT = '#0EA5E9';
const LIGHT = '#F8FAFC';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function shell(innerHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px;background:${LIGHT};font-family:${FONT};color:#1e293b;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    ${innerHtml}
    <div style="padding:16px 28px;background:${LIGHT};border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
      ${escapeHtml(site.name)} &middot; ${escapeHtml(site.role)} &middot; ${escapeHtml(site.location)}
    </div>
  </div>
</body>
</html>`;
}

function row(label, value) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#64748b;width:130px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;color:#0f172a;font-weight:600;">${value}</td>
  </tr>`;
}

/** Sent to Nolundi. Optimised for acting on quickly from a phone. */
function enquiryNotification(enquiry) {
  const tier = findTier(enquiry.tier);
  const tierLabel = tier ? tier.optionLabel : enquiry.tier;

  const received = new Date(enquiry.receivedAt).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg'
  });

  const replyTo = `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(
    'Re: your project enquiry'
  )}`;

  return shell(`
    <div style="background:${DARK};padding:24px 28px;">
      <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};font-weight:700;">New enquiry</p>
      <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;font-weight:800;">${escapeHtml(enquiry.name)}${
        enquiry.business ? ` &middot; ${escapeHtml(enquiry.business)}` : ''
      }</h1>
    </div>

    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Package', escapeHtml(tierLabel))}
        ${row('Email', `<a href="mailto:${escapeHtml(enquiry.email)}" style="color:${PRIMARY};">${escapeHtml(enquiry.email)}</a>`)}
        ${enquiry.phone ? row('Phone', escapeHtml(enquiry.phone)) : ''}
        ${row('Received', escapeHtml(received) + ' SAST')}
      </table>

      <p style="margin:20px 0 6px;font-size:13px;color:#64748b;">Project details</p>
      <div style="background:${LIGHT};border:1px solid #e2e8f0;border-radius:12px;padding:16px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${
        enquiry.notes ? escapeMultiline(enquiry.notes) : '<em style="color:#94a3b8;">No additional notes provided.</em>'
      }</div>

      <div style="margin-top:24px;">
        <a href="${escapeHtml(replyTo)}" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;">Reply to ${escapeHtml(enquiry.name)}</a>
      </div>

      <p style="margin:20px 0 0;font-size:11px;color:#94a3b8;">
        Ref ${escapeHtml(enquiry.id)} &middot; IP ${escapeHtml(enquiry.ip)}
      </p>
    </div>
  `);
}

/**
 * Sent to the visitor. Deliberately makes no promise about response time
 * beyond "as soon as I can" and quotes no price.
 */
function enquiryAcknowledgement(enquiry) {
  const tier = findTier(enquiry.tier);
  const tierLabel = tier ? tier.optionLabel : enquiry.tier;

  return shell(`
    <div style="background:${DARK};padding:24px 28px;">
      <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};font-weight:700;">Enquiry received</p>
      <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;font-weight:800;">Thanks, ${escapeHtml(enquiry.name)}</h1>
    </div>

    <div style="padding:24px 28px;font-size:15px;line-height:1.7;">
      <p style="margin:0 0 16px;">
        Your enquiry reached me and I'll come back to you personally. Nothing is
        charged and nothing is committed until you've seen a quote and approved it.
      </p>

      <p style="margin:0 0 8px;font-size:13px;color:#64748b;">What you sent</p>
      <table style="width:100%;border-collapse:collapse;background:${LIGHT};border:1px solid #e2e8f0;border-radius:12px;">
        <tr><td style="padding:14px 16px;">
          <span style="font-size:13px;color:#64748b;">Package</span><br>
          <strong style="font-size:14px;color:#0f172a;">${escapeHtml(tierLabel)}</strong>
          ${
            enquiry.notes
              ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeMultiline(enquiry.notes)}</div>`
              : ''
          }
        </td></tr>
      </table>

      <p style="margin:20px 0 0;">
        If it's urgent, WhatsApp is fastest:
        <a href="${escapeHtml(site.whatsappLink('Hi Nolundi, I just submitted an enquiry on your site.'))}" style="color:${PRIMARY};font-weight:600;">${escapeHtml(site.whatsappDisplay)}</a>
      </p>

      <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
        Ref ${escapeHtml(enquiry.id)} &mdash; quote this if you reply.
      </p>
    </div>
  `);
}

module.exports = { enquiryNotification, enquiryAcknowledgement };
