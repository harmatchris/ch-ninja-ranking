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
- GitHub Pages Hosting
- JSON-basierte Datenhaltung
- Google Fonts: Barlow Condensed + Barlow

---

*Entwurf v1.0 · Overground Basel / OG Ninja Comp App · April 2026*
