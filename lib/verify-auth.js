import { getAuth } from './firebase-admin.js';

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function verifyRequest(req, { requireAdmin = false } = {}) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new AuthError(401, 'Missing bearer token');

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(match[1]);
  } catch (e) {
    throw new AuthError(401, 'Invalid or expired token');
  }

  const isAdmin = decoded.admin === true;
  const isEditor = decoded.editor === true || isAdmin;

  if (requireAdmin && !isAdmin) {
    throw new AuthError(403, 'Admin role required');
  }
  if (!isEditor) {
    throw new AuthError(403, 'Editor or admin role required');
  }

  return {
    uid: decoded.uid,
    email: decoded.email || null,
    isAdmin,
    isEditor
  };
}

export function sendAuthError(res, err) {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Unauthorized' });
}
