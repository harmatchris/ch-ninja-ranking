# CH Ninja Ranking

**Offizielle Schweizer Ninja-Sport-Meisterschaft — Ranking Website**

Live: [harmatchris.github.io/ch-ninja-ranking](https://harmatchris.github.io/ch-ninja-ranking)

---

## Über das Projekt

Diese Website zeigt das offizielle Jahresranking der Schweizer Ninja-Sport-Meisterschaft. Die Ranglisten werden automatisch über die **OG Ninja Comp App** berechnet und nach jedem akkreditierten Wettkampf aktualisiert.

## Saisonstruktur

- **2–3 akkreditierte Wettkämpfe** pro Saison
- **Finale-WK**: Letzter Wettkampf des Jahres (OG Games, Dezember) — Titelübergabe
- **Regelwerk**: IGN-Regelwerk 2025/2026

## Algorithmus (Option B+)

Basierend auf dem deutschen IGN Ninja-Sport-Ranking:
1. **Potential** = normierter Lookback-Wert aus besten 2 WK-Resultaten
2. **Competition Value (CV)** = Summe aller Potentiale der Division-Teilnehmer
3. **Punkte** = gedämpfte Placement-Funktion × CV
4. **Newbie-Potential** = 70 Punkte (fix)

## Datenstruktur

Rankings werden als JSON-Dateien in `data/` gespeichert:

```
data/
  ranking-2026.json   ← Aktuelle Saison
  ranking-2025.json   ← Archiv
```

Die Comp App exportiert nach jedem WK automatisch ein aktualisiertes JSON.

## CH-Ranking Toggle (Comp App)

In der OG Ninja Comp App gibt es beim Anlegen eines Wettkampfs einen passwortgeschützten Toggle:
- **🇨🇭 CH Ninja Ranking** — Ergebnisse fliessen ins CH Ranking ein
- **★ Finale-Wettkampf** — Titelübergabe an diesem WK

Passwort: `CH2026` (nur für akkreditierte Veranstalter)

## Divisionen

| Kürzel | Division | Titel |
|--------|----------|-------|
| am1 / af1 | Adults LK1 ♂/♀ | 🥇 Schweizer Meister/in |
| tm1 / tf1 | Teens LK1 ♂/♀ | 🥇 Schweizer Meister/in |
| km1 / kf1 | Kids LK1 ♂/♀ | 🥇 Schweizer Meister/in |
| am2, af2, tm2, tf2, km2, kf2 | LK2 Divisionen | NSR-Sieger/in Schweiz |
| mast | Masters (40+) | NSR-Sieger/in Schweiz |
| bam | Bambini | NSR-Sieger/in Schweiz |

## Tech Stack

- Statische Single-Page HTML/CSS/JS (keine Frameworks)
- Firebase RTDB für Live-Sync der Wettkampfdaten
- Vercel Hosting (öffentliches Ranking + Admin-API)
- JSON-basierte Daten als Fallback
- Google Fonts: Barlow Condensed + Barlow

---

## Admin-Backend

Admin-Oberfläche unter `/admin.html` mit 5 Bereichen:

- **Athleten** — CRUD (hinzufügen, umbenennen, Land ändern, Division zuweisen, sperren)
- **Rankings** — Manueller Rang- und Punkte-Override pro Wettkampf & Division
- **Wettkämpfe** — Name / Datum / Ort / Venue / Status pro WK anpassen
- **Scoring** — Mindestpunkte, Exponent und CV-Multiplikator pro WK
- **Benutzer** — weitere Admins/Editoren anlegen (nur Admins)

Alle Änderungen werden als Overrides in Firebase RTDB unter `ogn/admin/{Jahr}/` gespeichert und live in das öffentliche Ranking eingeblendet — ohne Redeploy.

### Rollen

- `admin` — alle Rechte, inklusive Benutzerverwaltung
- `editor` — alle Datenbearbeitung, keine Benutzerverwaltung

### Setup & Deploy (Vercel via GitHub)

1. **Repo pushen** — `git push origin main` auf `harmatchris/ch-ninja-ranking`
2. **Vercel verbinden** — Dashboard → "Add new project" → Import vom GitHub-Repo (Framework: Other)
3. **Env-Variablen in Vercel** setzen:
   - `FIREBASE_SERVICE_ACCOUNT` — Service-Account-JSON aus Firebase Console (Project Settings → Service Accounts → Generate new private key) als einzeiligen JSON-String
   - `FIREBASE_DB_URL` — `https://ninja-hq-chris-default-rtdb.firebaseio.com`
4. **Firebase Rules** publizieren — Inhalt von `firebase-rules.json` in Firebase Console → Realtime Database → Rules einfügen → Publish
5. **Ersten Admin anlegen** (einmalig, lokal):
   ```bash
   npm install
   FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" \
   BOOTSTRAP_EMAIL=harmatchris@gmail.com \
   BOOTSTRAP_PASSWORD='<dein Passwort>' \
   node scripts/bootstrap-admin.js
   ```
   `service-account.json` ist gitignored. Passwort wird direkt in Firebase Auth gespeichert.
6. `/admin.html` aufrufen, einloggen. Weitere Nutzer im Benutzer-Tab anlegen.

Jeder `git push main` deployt automatisch.

### Passwort vergessen?

```bash
FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" \
BOOTSTRAP_EMAIL=harmatchris@gmail.com \
BOOTSTRAP_PASSWORD='<neues Passwort>' \
node scripts/bootstrap-admin.js --update-password
```

---

*Entwurf v1.0 · Overground Basel / OG Ninja Comp App · April 2026*
