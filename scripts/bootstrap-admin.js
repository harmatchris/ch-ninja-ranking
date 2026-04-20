#!/usr/bin/env node
/**
 * One-shot admin bootstrap.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" \
 *   BOOTSTRAP_EMAIL=you@example.com \
 *   BOOTSTRAP_PASSWORD='...' \
 *   node scripts/bootstrap-admin.js
 *
 * Idempotent — if the user already exists, it just (re)sets the admin claim
 * and optionally updates the password when --update-password is passed.
 */
import { getAuth } from '../lib/firebase-admin.js';

async function main() {
  const email = process.env.BOOTSTRAP_EMAIL;
  const password = process.env.BOOTSTRAP_PASSWORD;
  const updatePassword = process.argv.includes('--update-password');

  if (!email || !password) {
    console.error('❌  BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD must be set');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌  Password must be at least 8 characters');
    process.exit(1);
  }

  const auth = getAuth();

  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`✓  User already exists: ${user.uid}`);
    if (updatePassword) {
      await auth.updateUser(user.uid, { password });
      console.log('✓  Password updated');
    } else {
      console.log('  (pass --update-password to reset it)');
    }
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`✓  Created user: ${user.uid}`);
  }

  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log('✓  Granted admin claim');
  console.log('');
  console.log('Done. Log in at /admin.html with:', email);
}

main().catch(err => {
  console.error('❌  Bootstrap failed:', err);
  process.exit(1);
});
