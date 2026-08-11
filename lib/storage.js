/**
 * Enquiry log.
 *
 * Two drivers behind one interface so a database can drop in later without
 * touching the route:
 *
 *   jsonFile  — appends to data/enquiries.json. Used locally.
 *   console   — writes one structured JSON line to stdout. Used on Vercel,
 *               where the filesystem is read-only apart from /tmp and /tmp
 *               is wiped between invocations, so a file log would silently
 *               lose every record.
 *
 * To add a database driver: implement `save(enquiry)` returning the stored
 * record, and select it in `resolveDriver()`. The Firestore shape used in
 * the bakery project would slot straight in here.
 */

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, '..', 'data', 'enquiries.json');

const jsonFileDriver = {
  name: 'jsonFile',
  async save(enquiry) {
    let existing = [];
    try {
      const raw = await fs.readFile(FILE, 'utf8');
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
    } catch (err) {
      // ENOENT on first write is expected. A corrupt file should not lose
      // the enquiry, so fall back to an empty list and carry on.
      if (err.code !== 'ENOENT') {
        console.error('[storage] could not read enquiry log, starting fresh:', err.message);
      }
    }

    existing.push(enquiry);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(existing, null, 2), 'utf8');
    return enquiry;
  }
};

const consoleDriver = {
  name: 'console',
  async save(enquiry) {
    // Single line so Vercel's log viewer keeps it as one searchable entry.
    console.log('[enquiry] ' + JSON.stringify(enquiry));
    return enquiry;
  }
};

function resolveDriver() {
  const configured = process.env.ENQUIRY_STORAGE;
  if (configured === 'jsonFile') return jsonFileDriver;
  if (configured === 'console') return consoleDriver;
  // Vercel sets VERCEL=1 in every runtime environment.
  return process.env.VERCEL ? consoleDriver : jsonFileDriver;
}

/**
 * Persist an enquiry. Never throws — a storage failure must not cost us the
 * email, which is the delivery path that actually reaches Nolundi.
 */
async function saveEnquiry({ values, ip, userAgent }) {
  const enquiry = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    name: values.name,
    business: values.business || null,
    email: values.email,
    phone: values.phone || null,
    tier: values.tier,
    notes: values.notes || null,
    ip,
    userAgent: userAgent || null
  };

  const driver = resolveDriver();
  try {
    await driver.save(enquiry);
  } catch (err) {
    console.error(`[storage:${driver.name}] failed to save enquiry:`, err.message);
  }
  return enquiry;
}

module.exports = { saveEnquiry };
