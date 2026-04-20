import { getAuth } from '../../lib/firebase-admin.js';
import { verifyRequest, sendAuthError, AuthError } from '../../lib/verify-auth.js';

const VALID_ROLES = new Set(['admin', 'editor']);

function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function rolesFromClaims(claims = {}) {
  if (claims.admin) return 'admin';
  if (claims.editor) return 'editor';
  return null;
}

function claimsForRole(role) {
  if (role === 'admin') return { admin: true };
  if (role === 'editor') return { editor: true };
  return {};
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
  let caller;
  try {
    caller = await verifyRequest(req, { requireAdmin: true });
  } catch (e) {
    if (e instanceof AuthError) return sendAuthError(res, e);
    return res.status(500).json({ error: e.message });
  }

  const auth = getAuth();

  try {
    if (req.method === 'GET') {
      const list = await auth.listUsers(1000);
      const users = list.users.map(u => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || null,
        disabled: u.disabled,
        role: rolesFromClaims(u.customClaims),
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime || null
      }));
      return res.status(200).json({ users });
    }

    const body = await readBody(req);

    if (req.method === 'POST') {
      const { email, password, role, displayName } = body || {};
      if (!isEmail(email)) return res.status(400).json({ error: 'Valid email required' });
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      if (!VALID_ROLES.has(role)) return res.status(400).json({ error: 'role must be admin or editor' });

      const user = await auth.createUser({
        email,
        password,
        displayName: displayName || undefined,
        emailVerified: false
      });
      await auth.setCustomUserClaims(user.uid, claimsForRole(role));
      return res.status(201).json({ uid: user.uid, email: user.email, role });
    }

    if (req.method === 'PATCH') {
      const { uid, disabled, role, password, displayName } = body || {};
      if (!uid) return res.status(400).json({ error: 'uid required' });
      if (uid === caller.uid && (disabled === true || role === 'editor')) {
        return res.status(400).json({ error: 'You cannot disable or demote your own account' });
      }

      const updates = {};
      if (typeof disabled === 'boolean') updates.disabled = disabled;
      if (typeof password === 'string' && password.length >= 8) updates.password = password;
      if (typeof displayName === 'string') updates.displayName = displayName;
      if (Object.keys(updates).length > 0) await auth.updateUser(uid, updates);

      if (role !== undefined) {
        if (!VALID_ROLES.has(role)) return res.status(400).json({ error: 'role must be admin or editor' });
        await auth.setCustomUserClaims(uid, claimsForRole(role));
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const uid = body?.uid || new URL(req.url, 'http://x').searchParams.get('uid');
      if (!uid) return res.status(400).json({ error: 'uid required' });
      if (uid === caller.uid) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }
      await auth.deleteUser(uid);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[users] failed', e);
    return res.status(500).json({ error: e.message });
  }
}
