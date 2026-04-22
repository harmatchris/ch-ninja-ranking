# Deploy Prompt — CH Ninja Ranking

Copy everything below (from `---BEGIN---` to `---END---`) and paste it as the task for your Claude agent / Claude Code session / cloud agent. Fill in the placeholders in the "Credentials" section before pasting.

---BEGIN---

## Task

Finish deploying the CH Ninja Ranking project (public site + admin backend + license flow) to Vercel, bootstrap the first admin user, and publish Firebase Realtime Database rules. Confirm end-to-end that the deployed site works.

## Repo

- GitHub: `https://github.com/harmatchris/ch-ninja-ranking`
- Default branch: `main`
- Local path (if running on Chris's Mac): `/Users/chrisharmat/Library/Mobile Documents/com~apple~CloudDocs/01 Arbeit/01 Apps/ch-ninja-ranking`
- Tech: static `index.html`, `admin.html`, `lizenz.html` + Vercel serverless fns in `api/admin/*` + Firebase (project `ninja-hq-chris`, Realtime Database)

## Current state (as of handoff)

- Code is committed to `main` locally; **1 unpushed commit** (`22ce26c feat: CH-Lizenz page + admin review flow`). Remote may or may not have it yet — check.
- Public site is live at `https://ch-ninja-ranking.vercel.app/` (auto-deployed from `main`). Vercel project is already connected to the GitHub repo.
- API endpoints `/api/admin/save`, `/api/admin/delete`, `/api/admin/users`, `/api/admin/licenses` are deployed but return **500** until env vars are set.
- Firebase service account is **not yet** stored in Vercel env.
- Firebase RTDB rules are **not yet** published (current rules are probably the Firebase default, which may block writes).
- No admin user exists in Firebase Auth yet.

## Credentials Chris will supply alongside this prompt

Fill these in before handing off:

```
FIREBASE_SERVICE_ACCOUNT = <paste the entire service-account.json contents as a single-line JSON string>
FIREBASE_DB_URL          = https://ninja-hq-chris-default-rtdb.firebaseio.com
BOOTSTRAP_EMAIL          = harmatchris@gmail.com
BOOTSTRAP_PASSWORD       = <the password Chris wants for his admin login>
GITHUB_PAT               = <classic PAT with repo scope, only if remote access to the repo is needed>
VERCEL_TOKEN             = <from https://vercel.com/account/tokens — if using Vercel CLI>
```

If any of these are missing, stop and ask Chris for them before doing anything destructive.

## Steps to execute

### 1. Push any pending commits

```bash
cd "<repo path>"
git fetch origin main
if [ "$(git rev-list --count origin/main..HEAD)" -gt 0 ]; then
  git push origin main
fi
```

### 2. Set Vercel environment variables

Using Vercel CLI (preferred if `$VERCEL_TOKEN` is set):

```bash
npm install -g vercel
vercel login --token "$VERCEL_TOKEN"  # or: vercel login (interactive)
vercel link --yes --project ch-ninja-ranking
# Add env vars for production (and preview if desired)
printf "%s" "$FIREBASE_SERVICE_ACCOUNT" | vercel env add FIREBASE_SERVICE_ACCOUNT production
printf "%s" "$FIREBASE_DB_URL"          | vercel env add FIREBASE_DB_URL production
vercel --prod
```

If Vercel CLI is not available, do it through the dashboard:
- https://vercel.com/dashboard → project `ch-ninja-ranking` → Settings → Environment Variables
- Add `FIREBASE_SERVICE_ACCOUNT` (paste service-account JSON as one line)
- Add `FIREBASE_DB_URL` = `https://ninja-hq-chris-default-rtdb.firebaseio.com`
- Trigger a redeploy (Deployments → ⋯ → Redeploy) so functions pick up the env.

### 3. Publish Firebase RTDB rules

File to publish: `firebase-rules.json` at the repo root. Contents should be used verbatim as the RTDB rules.

Using Firebase CLI (needs `firebase login`):

```bash
npm install -g firebase-tools
firebase login   # or firebase login:ci to use a CI token
# Create firebase.json if missing
cat > firebase.json <<'EOF'
{ "database": { "rules": "firebase-rules.json" } }
EOF
firebase use ninja-hq-chris
firebase deploy --only database
```

If Firebase CLI is not available: open https://console.firebase.google.com/project/ninja-hq-chris/database/ninja-hq-chris-default-rtdb/rules → paste the contents of `firebase-rules.json` → Publish.

### 4. Bootstrap the first admin user

On any machine with the repo cloned and Node.js ≥18:

```bash
cd "<repo path>"
npm install
FIREBASE_SERVICE_ACCOUNT="$FIREBASE_SERVICE_ACCOUNT" \
BOOTSTRAP_EMAIL="$BOOTSTRAP_EMAIL" \
BOOTSTRAP_PASSWORD="$BOOTSTRAP_PASSWORD" \
node scripts/bootstrap-admin.js
```

Expected output includes `✓  Granted admin claim`. If it prints `User already exists`, re-run with `--update-password` to reset the password:

```bash
FIREBASE_SERVICE_ACCOUNT="$FIREBASE_SERVICE_ACCOUNT" \
BOOTSTRAP_EMAIL="$BOOTSTRAP_EMAIL" \
BOOTSTRAP_PASSWORD="$BOOTSTRAP_PASSWORD" \
node scripts/bootstrap-admin.js --update-password
```

### 5. Verify the deploy end-to-end

Run these checks and report results:

```bash
BASE=https://ch-ninja-ranking.vercel.app

# Public page loads
curl -sI $BASE/              | head -1   # expect 200
curl -sL $BASE/              | grep -oE "<title>[^<]+</title>" | head -1
# New license page loads
curl -sL $BASE/lizenz        | grep -oE "<title>[^<]+</title>" | head -1
# Admin page loads
curl -sL $BASE/admin         | grep -oE "<title>[^<]+</title>" | head -1
# API endpoints exist & demand auth (expect 401, NOT 404 or 500)
curl -so /dev/null -w "save:    %{http_code}\n" -X POST $BASE/api/admin/save
curl -so /dev/null -w "delete:  %{http_code}\n" -X POST $BASE/api/admin/delete
curl -so /dev/null -w "users:   %{http_code}\n"        $BASE/api/admin/users
curl -so /dev/null -w "licenses:%{http_code}\n"        $BASE/api/admin/licenses
```

If any endpoint returns **500**, env vars are missing or malformed — re-check step 2 and redeploy.
If any returns **404**, the function did not deploy — check Vercel build logs.

### 6. Sanity-check admin login (manual, if no browser tooling)

Ask Chris to:

1. Open `https://ch-ninja-ranking.vercel.app/admin` in a browser
2. Log in as the bootstrap email + password
3. Confirm 5 tabs are visible: Athleten, Rankings, Wettkämpfe, Lizenzen, Scoring, Benutzer
4. In the Lizenzen tab, verify the "Freigabe" toggle shows "Formular geschlossen" (feature flag off by default)

## Success criteria

- [ ] `git log origin/main` shows the unpushed commit is now on remote
- [ ] All four `/api/admin/*` endpoints return **401** (not 404, not 500)
- [ ] `/lizenz` returns a page with title containing "Lizenzvertrag"
- [ ] `/admin` returns a page with title containing "Admin"
- [ ] `firebase-rules.json` contents match the live rules in Firebase console
- [ ] The bootstrap email can log in at `/admin` and all tabs render

## Things NOT to do

- Do NOT commit `service-account.json` to the repo (it is gitignored — keep it that way).
- Do NOT store `BOOTSTRAP_PASSWORD` in any file, log, or Vercel env (it only belongs in Firebase Auth).
- Do NOT change Firebase security rules without pasting exactly the contents of `firebase-rules.json`.
- Do NOT redeploy a specific commit older than the current `main` HEAD (could lose the license page / admin backend).
- If a step fails, STOP and report what happened rather than forcing retries.

## Handoff report format

When done, return a short markdown summary:
- which steps succeeded / which were skipped
- the final HTTP status of each probe in step 5
- the commit SHA currently deployed (from Vercel, if accessible)
- any credentials/secrets that need to be rotated because they touched logs or chat

---END---
