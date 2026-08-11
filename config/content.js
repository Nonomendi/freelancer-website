/**
 * Editorial content: FAQ and testimonials.
 *
 * FAQ answers are factual — they restate the pricing, process and terms
 * already on the site. If you change a price in pricing.js, re-read these:
 * the two that quote figures are marked with a comment.
 *
 * TESTIMONIALS ARE PLACEHOLDERS. They are deliberately not written as real
 * quotes from real people, because inventing a client testimonial is
 * fabricating evidence. Replace `placeholder: true` entries with genuine
 * quotes you have permission to publish, then set placeholder: false.
 * Entries with placeholder: true render greyed out and visibly marked.
 */

const faqs = [
  {
    q: 'How much does a website cost?',
    // Figures below mirror pricing.js — update together.
    a: 'A single landing page runs R1,990 – R3,500, and a 3-5 page starter site R3,500 – R6,500. E-commerce starts at R7,500. The final number depends on how many pages you need and how much custom work is involved — you get a fixed quote before anything starts.'
  },
  {
    q: 'How long will my project take?',
    a: 'A Starter Landing Page is typically a 3 - 5 day turnaround. Larger sites and apps depend on scope, so a timeline is agreed with your quote rather than guessed upfront.'
  },
  {
    q: 'Do I pay anything before I see a quote?',
    a: 'No. You describe what you need, you get a clear price and timeline, and nothing is charged until you approve it. Asking costs nothing.'
  },
  {
    q: 'What do you need from me to get started?',
    a: 'A rough idea of what your business does and what you want the site or app to achieve. Copy, logos and photos help but are not required on day one — a lot of projects start with a conversation and nothing else.'
  },
  {
    q: 'Do you work with Salesforce?',
    // Figures below mirror pricing.js — update together.
    a: 'Yes. Apex development, Lightning Web Components and Flow automation are billed at R450/hr, and scoped end-to-end implementation projects run R12,000 – R60,000+. Agentforce and Flowgear certified.'
  },
  {
    q: 'Are you available for ongoing work after launch?',
    a: 'Yes. Maintenance and support are available once your project is live — updates, fixes and new features as your business changes.'
  },
  {
    q: 'Do you only work with clients in Johannesburg?',
    a: 'Johannesburg is home, and local clients are welcome to meet in person, but the work is done remotely and clients anywhere in South Africa are fine.'
  },
  {
    q: 'What technologies do you build with?',
    a: 'React, Angular, Java, Python and Node on the web side, and Apex, LWC and Flows on Salesforce. The right choice depends on the project rather than a favourite tool.'
  }
];

/**
 * PLACEHOLDER CONTENT — see the note at the top of this file.
 * No real person said any of this. Replace before launch.
 */
const testimonials = [
  {
    placeholder: true,
    quote:
      'Replace this with a real quote from a real client. Two or three sentences about what you built for them and what changed for their business afterwards works best.',
    name: 'Client name',
    role: 'Their role, Their business',
    project: 'Which package they took'
  },
  {
    placeholder: true,
    quote:
      'A second placeholder. Ask a past client for a sentence or two by WhatsApp — most people are happy to, and a specific, ordinary-sounding quote is far more convincing than a polished one.',
    name: 'Client name',
    role: 'Their role, Their business',
    project: 'Which package they took'
  },
  {
    placeholder: true,
    quote:
      'A third placeholder. If you have fewer than three testimonials, delete the spare entries in config/content.js rather than leaving these on the live site.',
    name: 'Client name',
    role: 'Their role, Their business',
    project: 'Which package they took'
  }
];

/** True when every testimonial is still a placeholder. */
function testimonialsArePlaceholder() {
  return testimonials.every((t) => t.placeholder);
}

module.exports = { faqs, testimonials, testimonialsArePlaceholder };
