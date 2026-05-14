# Enspar Chiller Plant Audit Tool

A production-grade Progressive Web App (PWA) for on-site utility energy auditing. Built for Enspar Sustainability Pvt. Ltd.

---

## Features

- **6 equipment types**: WC Chillers, AC Chillers, Pumps, Cooling Towers, Air Compressors, Boilers
- **All Enspar Excel formulas**: CHW/CW ΔT, TR load, COP, kW/TR, affinity law, tower effectiveness, combustion efficiency
- **Traffic-light status**: Green / Amber / Red for every calculated parameter
- **AI photo extraction**: Point camera at a nameplate → fields populate automatically (requires Anthropic API key)
- **Analysis report**: Plant KPIs, AC→WC replacement opportunity, findings & recommendations
- **Export to Excel**: Matching Enspar 8-sheet format with findings tab
- **PIN lock**: 4-digit PIN, SHA-256 hashed, session-based
- **PWA / offline-capable**: Installable on Android/iOS, works without internet
- **Auto-save**: Audit data saved to device localStorage every 2 seconds

---

## Quick Deploy to GitHub Pages

### 1. Create the repository

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create chiller-audit --public
git push -u origin main
```

> **Important**: The repo must be named `chiller-audit` to match the base URL in `vite.config.js`.  
> If you use a different name, edit `vite.config.js` line 6: `base: '/your-repo-name/'`

### 2. Enable GitHub Pages

1. Go to your repo → Settings → Pages
2. Source: **GitHub Actions**
3. Save

### 3. The workflow runs automatically

Push to `main` → GitHub Actions builds and deploys. Your app will be live at:
```
https://your-username.github.io/chiller-audit/
```

---

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173/chiller-audit/`

---

## AI Photo Extraction

1. Go to Settings (⚙️) in the app
2. Enter your Anthropic API key (`sk-ant-...`)
3. In any equipment section, assign a photo from the gallery
4. Tap **🔍 Extract** — fields will populate from the nameplate image

Supports: chiller nameplates, CPM/control panel displays, pump nameplates, cooling tower nameplates.  
**Always verify AI-extracted values** — they are highlighted with a green border.

---

## Data Storage

| Data | Where |
|------|-------|
| Audit data (site, equipment, readings) | `localStorage` — device only |
| Photos | `IndexedDB` — device only |
| PIN hash | `localStorage` — SHA-256, never plaintext |
| API key | `localStorage` — only sent to Anthropic API |

Data never leaves the device unless you export to Excel.

---

## Formulas Used

| Parameter | Formula |
|-----------|---------|
| Cooling Load (TR) | `Flow (m³/hr) × ΔT × 1.1611 / 3.517` |
| AC Derating Factor | `1 − MAX(0, AmbDB − DesignAmb) × 0.008` |
| Pump Diff Head | `(Outlet − Inlet) bar × 10.197 m WC` |
| Pump Hyd Efficiency | `Q × H / (367.2 × P)` |
| Tower Effectiveness | `Range / (Range + Approach)` |
| Combustion Efficiency | `1 − 0.0068 × O₂% / (21 − CO₂%)` [Siegert] |
| VFD Affinity — Flow | `N₁/N₀` |
| VFD Affinity — Head | `(N₁/N₀)²` |
| VFD Affinity — Power | `(N₁/N₀)³` |

All formulas match the Enspar On-Site Audit Data Capture Excel template exactly.

---

## Roadmap

- **Phase 2**: Google OAuth + FastAPI backend sync, multi-site audit history
- **Phase 3**: Maintenance rounds mode, shift-level data logging, integration with dashboard FDD alerts
- **Phase 4**: Predictive maintenance trends, ML-based fault detection, automated work orders

---

*Enspar Sustainability Pvt. Ltd. — Energy Auditing & Analytics*
