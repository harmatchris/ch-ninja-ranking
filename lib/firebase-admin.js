import admin from 'firebase-admin';

let initialized = false;

export function getAdmin() {
  if (initialized) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var missing');

  let creds;
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
  }

  const databaseURL = process.env.FIREBASE_DB_URL
    || `https://${creds.project_id}-default-rtdb.firebaseio.com`;

  admin.initializeApp({
    credential: admin.credential.cert(creds),
    databaseURL
  });

  initialized = true;
  return admin;
}

export function getDb() {
  return getAdmin().database();
}

export function getAuth() {
  return getAdmin().auth();
}
