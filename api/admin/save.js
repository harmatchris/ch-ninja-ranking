import { getDb } from '../../lib/firebase-admin.js';
import { verifyRequest, sendAuthError, AuthError } from '../../lib/verify-auth.js';

const BASE = 'ogn/admin';
const ALLOWED_SECTIONS = new Set([
  'addedAthletes',
  'athleteEdits',
  'excluded',
  'rankOverrides',
  'scoring',
  'wks',
  'settings'
]);

function safeKey(k) {
  return typeof k === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(k);
}

function validatePath(section, rest) {
  if (!ALLOWED_SECTIONS.has(section)) return false;
  if (!rest) return true;
  const parts = rest.split('/').filter(Boolean);
  return parts.every(safeKey);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1_000_000) reject(new Error('Payload too large')); });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let user;
  try {
    user = await verifyRequest(req);
  } catch (e) {
    if (e instanceof AuthError) return sendAuthError(res, e);
    return res.status(500).json({ error: e.message });
  }

  let body;
  try { body = await readBody(req); } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON: ' + e.message });
  }

  const { season, updates } = body || {};
  if (!season || !/^\d{4}$/.test(String(season))) {
    return res.status(400).json({ error: 'season (YYYY) required' });
  }
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'updates object required' });
  }

  const multi = {};
  for (const [relPath, value] of Object.entries(updates)) {
    const parts = relPath.split('/').filter(Boolean);
    const [section, ...rest] = parts;
    if (!validatePath(section, rest.join('/'))) {
      return res.status(400).json({ error: `Invalid path: ${relPath}` });
    }
    if (value !== null && typeof value === 'object' && Object.keys(value).length === 0) {
      multi[`${BASE}/${season}/${relPath}`] = null;
    } else {
      multi[`${BASE}/${season}/${relPath}`] = value;
    }
  }

  multi[`${BASE}/${season}/_meta/updatedAt`] = Date.now();
  multi[`${BASE}/${season}/_meta/updatedBy`] = user.email || user.uid;

  try {
    await getDb().ref().update(multi);
    return res.status(200).json({ ok: true, count: Object.keys(updates).length });
  } catch (e) {
    console.error('[save] failed', e);
    return res.status(500).json({ error: e.message });
  }
}
