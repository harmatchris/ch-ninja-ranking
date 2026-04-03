#!/bin/bash
# ══════════════════════════════════════════════════════════
# CH Ninja Ranking — GitHub Setup & Push Script
# Führe dieses Script in deinem Terminal aus
# ══════════════════════════════════════════════════════════

echo "🇨🇭 CH Ninja Ranking — GitHub Deploy"
echo "═══════════════════════════════════"

# Change to script directory
cd "$(dirname "$0")"

# Init git if needed
if [ ! -d .git ]; then
  git init
  git branch -M main
fi

# Configure git
git config user.name "Chris Harmat"
git config user.email "harmatchris@gmail.com"

# Add remote if not exists
git remote remove origin 2>/dev/null
git remote add origin https://github.com/harmatchris/ch-ninja-ranking.git

# Stage all files
git add index.html data/ranking-2026.json README.md .nojekyll

# Commit
git commit -m "feat: CH Ninja Ranking Website v1.0 — Dark Athletic Design

- Dark Athletic Design basierend auf CH Ninja Ranking Konzept v1
- Seiten: Ranking, Wettkämpfe, Athleten, Reglement (komplett)
- Vollständiger Option B+ Algorithmus im Reglement
- Saison 2026 mit Beispieldaten (WK1 abgeschlossen)
- JSON-Datenstruktur für OG Ninja Comp App Integration
- Selektor: Division-Tabs, WK-Cards, Saison-Toggle
- GitHub Pages ready (.nojekyll)"

echo ""
echo "📤 Pushing to GitHub..."
echo "   (Du wirst nach deinem GitHub-Passwort/Token gefragt)"
echo ""

# Push — GitHub needs a Personal Access Token as password
# Create one at: https://github.com/settings/tokens/new?scopes=repo
git push -u origin main

echo ""
echo "✅ Fertig! Aktiviere GitHub Pages:"
echo "   → https://github.com/harmatchris/ch-ninja-ranking/settings/pages"
echo "   → Source: 'Deploy from a branch' → Branch: 'main' → /"
echo ""
echo "🌐 Website wird verfügbar unter:"
echo "   https://harmatchris.github.io/ch-ninja-ranking"
