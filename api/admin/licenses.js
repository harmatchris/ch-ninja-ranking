import { getDb, getAuth } from '../../lib/firebase-admin.js';
import { verifyRequest, sendAuthError, AuthError } from '../../lib/verify-auth.js';

const VALID_STATUS = new Set(['draft', 'submitted', 'approved', 'rejected']);

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 200_000) reject(new Error('Payload too large')); });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  let caller;
  try {
    caller = await verifyRequest(req);
  } catch (e) {
    if (e instanceof AuthError) return sendAuthError(res, e);
    return res.status(500).json({ error: e.message });
  }

  const db = getDb();
  const seasonParam = new URL(req.url, 'http://x').searchParams.get('season');
  const season = seasonParam && /^\d{4}$/.test(seasonParam) ? seasonParam : '2026';

  try {
    if (req.method === 'GET') {
      const snap = await db.ref(`licenses/${season}`).once('value');
      const records = snap.val() || {};
      // Enrich with last sign-in from Firebase Auth (best effort)
      const auth = getAuth();
      const items = await Promise.all(Object.entries(records).map(async ([uid, rec]) => {
        let lastSignIn = null, disabled = false;
        try {
          const u = await auth.getUser(uid);
          lastSignIn = u.metadata.lastSignInTime || null;
          disabled = u.disabled;
        } catch {}
        return { uid, ...rec, lastSignIn, disabled };
      }));
      items.sort((a, b) => (b.submittedAt || b.updatedAt || 0) - (a.submittedAt || a.updatedAt || 0));
      return res.status(200).json({ licenses: items });
    }

    const body = await readBody(req);

    if (req.method === 'PATCH') {
      const { uid, action, rejectionReason, validUntil } = body || {};
      if (!uid) return res.status(400).json({ error: 'uid required' });
      if (!['approve', 'reject', 'reopen'].includes(action)) {
        return res.status(400).json({ error: 'action must be approve|reject|reopen' });
      }
      const ref = db.ref(`licenses/${season}/${uid}`);
      const existing = (await ref.once('value')).val();
      if (!existing) return res.status(404).json({ error: 'License record not found' });

      const patch = {
        reviewedBy: caller.email || caller.uid,
        reviewedAt: Date.now()
      };
      if (action === 'approve') {
        patch.status = 'approved';
        patch.approvedBy = caller.email || caller.uid;
        patch.approvedAt = Date.now();
        if (validUntil) patch.validUntil = validUntil;
        else {
          const d = new Date(); d.setFullYear(d.getFullYear() + 3);
          patch.validUntil = d.getTime();
        }
      } else if (action === 'reject') {
        patch.status = 'rejected';
        patch.rejectionReason = rejectionReason || 'Keine Begründung angegeben';
      } else if (action === 'reopen') {
        patch.status = 'draft';
        patch.rejectionReason = null;
      }
      await ref.update(patch);
      return res.status(200).json({ ok: true, status: patch.status });
    }

    if (req.method === 'DELETE') {
      const uid = body?.uid;
      if (!uid) return res.status(400).json({ error: 'uid required' });
      await db.ref(`licenses/${season}/${uid}`).remove();
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[licenses] failed', e);
    return res.status(500).json({ error: e.message });
  }
}
