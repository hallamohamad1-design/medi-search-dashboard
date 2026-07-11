# MediSearch Analytics Dashboard

> Angular 17 frontend for the MediSearch drug-tracking platform.  
> Design derived from [medi-search-eight.vercel.app](https://medi-search-eight.vercel.app/)

---

## Features

### Pharmacy Dashboard `/dashboard/pharmacy`
- Page traffic area chart — daily views over 30 days
- Drug search trends — most-searched drugs in your area (chart ↔ table toggle)
- Stat cards: total views, avg daily views, peak day, top drug

### Admin Dashboard `/dashboard/admin`
- System-wide KPI cards
- Pharmacy traffic ranking — sortable table with rank badges
- Area drug trends — governorate → city cascade filter
- Top searched drugs — horizontal bar chart
- Monthly period-over-period volume (stretch goal)

### Analytics Charts `/dashboard/analytics`
Eight chart types built with Chart.js / ng2-charts:

| Chart | Purpose |
|---|---|
| Multi-series line | Period-over-period traffic comparison |
| Mixed bar + line | Daily views bars with cumulative overlay |
| Doughnut | Pharmacy market share by views |
| Stacked bar | Drug searches split by governorate |
| Radar | Search intensity across 5 governorates |
| Horizontal bar | Weekly search velocity by day of week |
| Area | Cumulative search growth |
| Bubble | Drug demand vs supply (searches × pharmacies × price) |

### Drug Analytics Widget
Reusable `<ms-drug-search-analytics [drugId]="id" />` card — avg/min/max price, in-stock count, availability bar. Embed anywhere in the app.

---

## Architecture

```
src/
├── styles/
│   ├── design-tokens.scss   ← full brand token set
│   └── mixins.scss
├── app/
│   ├── models/              ← analytics.models.ts (all API shapes)
│   ├── services/
│   │   ├── dashboard.service.ts   ← all HTTP calls + stubs
│   │   └── auth.service.ts        ← wire to your auth system
│   ├── guards/
│   │   └── role.guard.ts          ← roleGuard('pharmacy'|'admin')
│   ├── layout/
│   │   └── dashboard-layout/      ← sidebar + topbar shell
│   ├── shared/components/
│   │   ├── stat-card/
│   │   ├── trend-chart/
│   │   ├── ranked-table/
│   │   └── drug-search-analytics/
│   └── features/
│       ├── pharmacy-dashboard/
│       ├── admin-dashboard/
│       ├── analytics-charts/
│       ├── drug-detail-demo/
│       └── unauthorized/
```

---

## Getting Started

```bash
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200)

**Switch to admin role during dev:**
```js
localStorage.setItem('dev_role', 'admin')
// then navigate to /dashboard/admin or /dashboard/analytics
```

---

## Wiring the Real API

1. Open `src/app/services/dashboard.service.ts`
2. Replace `const API_BASE = '/api'` with your actual base URL
3. Uncomment the `this.http.get(...)` lines and delete the `of(STUB_...)` lines beneath them

---

## Tech Stack

- Angular 17 (standalone components, signals, new control flow)
- Chart.js 4 + ng2-charts 6
- SCSS with design tokens
- SSR-ready (Angular Universal)
- Lazy-loaded routes

---

## Known Data Flags

- **Date gaps in traffic data** — the API doesn't zero-fill days with no views. If gaps exist, the line chart will skip those dates. Zero-fill server-side or in the service layer.
- **Area trends** — `governorate` and `city` are plain strings; ensure consistent casing from the API to avoid filter mismatches.
