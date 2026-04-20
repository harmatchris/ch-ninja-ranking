import { getDb } from '../../lib/firebase-admin.js';
import { verifyRequest, sendAuthError, AuthError } from '../../lib/verify-auth.js';

const BASE = 'ogn/admin';
const ALLOWED_SECTIONS = new Set([
  'addedAthletes',
  'athleteEdits',
  'excluded',
  'rankOverrides',
  'scoring',
  'wks'
]);

function safeKey(k) {
  return typeof k === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(k);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 100_000) reject(new Error('Payload too large')); });
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

  const { season, paths } = body || {};
  if (!season || !/^\d{4}$/.test(String(season))) {
    return res.status(400).json({ error: 'season (YYYY) required' });
  }
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'paths array required' });
  }

  const multi = {};
  for (const relPath of paths) {
    const parts = String(relPath).split('/').filter(Boolean);
    const [section, ...rest] = parts;
    if (!ALLOWED_SECTIONS.has(section) || !rest.every(safeKey)) {
      return res.status(400).json({ error: `Invalid path: ${relPath}` });
    }
    multi[`${BASE}/${season}/${relPath}`] = null;
  }

  multi[`${BASE}/${season}/_meta/updatedAt`] = Date.now();
  multi[`${BASE}/${season}/_meta/updatedBy`] = user.email || user.uid;

  try {
    await getDb().ref().update(multi);
    return res.status(200).json({ ok: true, count: paths.length });
  } catch (e) {
    console.error('[delete] failed', e);
    return res.status(500).json({ error: e.message });
  }
}
