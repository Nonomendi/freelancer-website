/**
 * EVERY price, tier and turnaround on the site lives in this file.
 *
 * To change pricing, edit here — the homepage cards, the services page,
 * the contact form dropdown and the AI assistant's system prompt all read
 * from this object. Do not hardcode a price in a template.
 *
 * Prices are stored as display strings (not numbers) because they are
 * ranges — "R1,990 – R3,500", "R35,000+" — and must render exactly as
 * written.
 */

/** Homepage "Crafted With Care" cards. */
const serviceGroups = [
  {
    id: 'websites',
    title: 'Websites',
    icon: 'laptop-code',
    theme: 'light',
    accent: 'primary',
    items: [
      {
        name: 'Landing Page',
        blurb: 'Single campaign page, form & info',
        price: 'R1,990 – R3,500'
      },
      {
        name: 'Starter (3-5 Pages)',
        blurb: 'Home, About, Services, Contact',
        price: 'R3,500 – R6,500'
      },
      {
        name: 'E-Commerce Store',
        blurb: 'Catalogs, payments, shipping',
        price: 'R7,500 – R25,000+'
      }
    ]
  },
  {
    id: 'apps',
    title: 'Apps',
    icon: 'mobile-screen',
    theme: 'light',
    accent: 'accent',
    items: [
      {
        name: 'MVP / Simple App',
        blurb: 'Single core feature, basic UI',
        price: 'R15,000 – R35,000'
      },
      {
        name: 'Standard Mobile/Web App',
        blurb: 'User accounts, database, moderate features',
        price: 'R35,000+'
      }
    ]
  },
  {
    id: 'salesforce',
    title: 'Salesforce',
    icon: 'salesforce',
    theme: 'dark',
    accent: 'accent',
    items: [
      { name: 'Apex Development / LWC', price: 'R450/hr' },
      { name: 'Automation (Flows)', price: 'R450/hr' },
      {
        name: 'Implementation Project',
        blurb: 'Scoped, end-to-end solution',
        price: 'R12,000 – R60,000+'
      }
    ]
  }
];

/**
 * Service tiers.
 *
 * `slug` is the stable value used by the contact form <select> and the
 * ?tier= query parameter. Never change a slug once it is live — change
 * `optionLabel` instead.
 */
const tiers = [
  {
    slug: 'tier-01',
    number: 'Tier 01',
    name: 'Starter Landing Page',
    optionLabel: 'Tier 01: Starter Landing Page',
    description:
      'Ideal for plumbers, salons, mechanics, and local services needing a quick online presence.',
    features: [
      'High-Converting Single Page',
      'Direct WhatsApp Messaging Button',
      'Fast Mobile-Responsive Design',
      '3 - 5 Day Turnaround'
    ],
    turnaround: '3 - 5 days',
    featured: false
  },
  {
    slug: 'tier-02',
    number: 'Tier 02',
    name: 'Multi-Page Business Site',
    optionLabel: 'Tier 02: Multi-Page Business Site',
    description:
      'Designed for growing companies requiring detailed services, contact forms, and SEO setup.',
    features: [
      'Up to 5 Custom Pages',
      'Google SEO Structure',
      'Interactive WhatsApp Quote Form',
      'Domain & Vercel Setup Included'
    ],
    turnaround: null,
    featured: true,
    badge: 'Most Popular'
  },
  {
    slug: 'tier-03',
    number: 'Tier 03',
    name: 'Salesforce & Web Apps',
    optionLabel: 'Tier 03: Salesforce / Custom Web App',
    description:
      'Tailored solutions for businesses needing CRM workflows, Lightning Web Components, or custom apps.',
    features: [
      'Salesforce LWC & Agentforce Flows',
      'API Integrations & Webhooks',
      'Tailored Web Application Build'
    ],
    turnaround: null,
    featured: false
  }
];

/** The four-step "Simple & Straightforward" process. */
const process = [
  {
    step: '1',
    title: 'Tell me your idea',
    body: 'Reach out with what you need—a website, an app, a Salesforce fix. No detail too small.'
  },
  {
    step: '2',
    title: 'Get a clear quote',
    body: "You'll get a straightforward price and timeline before any work begins—no surprises."
  },
  {
    step: '3',
    title: 'I build, you review',
    body: "Regular check-ins as it comes together, so you're never left wondering what's happening."
  },
  {
    step: 'launch',
    title: 'Launch & support',
    body: 'Your project goes live, with maintenance support available whenever you need it.'
  }
];

/**
 * Portfolio demos.
 *
 * TODO(nolundi): TWO problems with the `url` values below.
 *
 * 1. They are hashed Vercel *deployment* previews (note the -f0ssd96he-
 *    build hash) and break on every redeploy.
 *
 * 2. More urgently: all three are behind Vercel Deployment Protection.
 *    Checked August 2026 — each one redirects to vercel.com/login, so a
 *    visitor clicking "Launch Live Preview" is asked to sign in to Vercel.
 *    Fix in each project: Settings > Deployment Protection > set Vercel
 *    Authentication to Disabled (or Standard Protection, which leaves
 *    production public and only guards previews).
 *
 * `preview` is a placeholder graphic until real screenshots exist — which
 * cannot be captured while the demos are behind the login wall.
 */
const portfolio = [
  {
    id: 'plumbing',
    category: 'Local Trades',
    categoryClass: 'text-amber-600 bg-amber-50',
    title: 'Plumbing & Emergency Services',
    blurb:
      'Built for quick service dispatching, customer reviews, and urgent lead capture.',
    url: 'https://local-plumbing-landing-page-f0ssd96he-nonomendis-projects.vercel.app/#testimonials',
    urlIsStable: false,
    preview: '/img/preview-plumbing.svg',
    previewIsPlaceholder: true
  },
  {
    id: 'salon',
    category: 'Beauty & Spa',
    categoryClass: 'text-emerald-700 bg-emerald-50',
    title: 'Aura Salon & Spa',
    blurb:
      'Luxury visual design, service price menus, and easy online appointment booking.',
    url: 'https://salon-landing-page-demo-ayw58w4yr-nonomendis-projects.vercel.app/index.html',
    urlIsStable: false,
    preview: '/img/preview-salon.svg',
    previewIsPlaceholder: true
  },
  {
    id: 'corporate',
    category: 'Corporate Tier',
    categoryClass: 'text-blue-700 bg-blue-50',
    title: 'Apex Advisory Consultancy',
    blurb:
      'Multi-page corporate site with consultation contact forms and structured services.',
    url: 'https://corporate-consultancy-demo-obw6on1cg-nonomendis-projects.vercel.app/contact',
    urlIsStable: false,
    preview: '/img/preview-corporate.svg',
    previewIsPlaceholder: true
  }
];

/** Look up a tier by its stable slug. Returns undefined if not found. */
function findTier(slug) {
  return tiers.find((t) => t.slug === slug);
}

module.exports = { serviceGroups, tiers, process, portfolio, findTier };
