/**
 * Single source of truth for identity, contact details and navigation.
 * Nothing in views/ or routes/ should hardcode a phone number, an email
 * address or a nav label — it all comes from here.
 */

// International format, no leading zero, no spaces, no "+".
// This is the only place the number is written down.
const WHATSAPP_NUMBER = '27605396226';

// Human-readable version for display on the page.
const WHATSAPP_DISPLAY = '060 539 6226';

const EMAIL = 'nolundimendi4@gmail.com';

/**
 * Build a wa.me deep link with a pre-filled message.
 * @param {string} [message] plain text; encoded here so callers never have to.
 */
function whatsappLink(message) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

module.exports = {
  name: 'Nolundi Mendi',
  role: 'Full-Stack & Salesforce Developer',
  location: 'Johannesburg, South Africa',
  brandName: 'Nolundi',
  brandSuffix: '.dev',

  email: EMAIL,
  emailLink: `mailto:${EMAIL}`,

  whatsappNumber: WHATSAPP_NUMBER,
  whatsappDisplay: WHATSAPP_DISPLAY,
  whatsappLink,

  // Set BASE_URL in .env at deploy time. Canonical URLs, sitemap.xml and
  // Open Graph tags all derive from this one value.
  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),

  /**
   * Trust signals rendered next to the calls to action.
   *
   * TODO(nolundi): `responseTime` is intentionally null — I will not put a
   * response time on the site that you have not agreed to. Set it to a
   * string you can actually hold to (e.g. 'Replies within one business
   * day') and it appears next to every CTA. Leave it null and the line is
   * simply not rendered.
   */
  trust: {
    responseTime: null,
    noPayment: 'No payment until you approve the quote',
    location: 'Based in Johannesburg'
  },

  certifications: [
    { label: 'Azure Fundamentals', icon: 'microsoft', colour: 'text-blue-400' },
    { label: 'Agentforce Certified', icon: 'cloud', colour: 'text-sky-400' },
    { label: 'WeThinkCode_ Trained', icon: 'code', colour: 'text-emerald-400' },
    { label: 'Flowgear Certified', icon: 'flowgear', colour: 'text-purple-400' }
  ],

  // key is matched against `activeNav` in each page render.
  nav: [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'services', label: 'Services & Pricing', href: '/services' },
    { key: 'process', label: 'How It Works', href: '/#how-it-works' },
    { key: 'work', label: 'Portfolio', href: '/#work' },
    { key: 'contact', label: 'Contact & Quote', href: '/contact' }
  ],

  footerNav: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' }
  ]
};
