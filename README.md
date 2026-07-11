# MediSearch Analytics Dashboard

> Angular 17 frontend + Flask backend for the MediSearch drug-tracking platform.  
> Database: Neon (serverless Postgres) · Deployed on Vercel

---

## Live URLs (after deployment)

| Service | URL |
|---|---|
| **Frontend** | `https://medi-search-dashboard.vercel.app` |
| **Backend API** | `https://medi-search-api.vercel.app` |

---

## Local Development

### 1 — Backend (Flask)

```bash
cd BACK
pip install -r requirements.txt
cd app
python app.py          # runs on http://localhost:5000
```

### 2 — Frontend (Angular)

```bash
npm install --legacy-peer-deps
npm start              # ng serve + proxy → http://localhost:4200
```

The Angular dev-server proxy (`proxy.conf.json`) forwards all `/api/*` requests to `localhost:5000` automatically.

### Dev role switching (browser console)

```js
// Pharmacy view
localStorage.setItem('dev_role',     'pharmacy')
localStorage.setItem('dev_pharmacy', 'El Ezaby Pharmacy')  // must match dim_pharmacy.name

// Admin view
localStorage.setItem('dev_role', 'admin')
```

---

## Vercel Deployment

### Deploy the Backend first

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import this repo — **set Root Directory to `BACK`**
3. Framework Preset: **Other**
4. Add Environment Variables (Settings → Environment Variables):

| Variable | Value |
|---|---|
| `DB_HOST` | `ep-wandering-hill-at0u1gzo-pooler.c-9.us-east-1.aws.neon.tech` |
| `DB_NAME` | `neondb` |
| `DB_USER` | `neondb_owner` |
| `DB_PASSWORD` | *(your Neon password)* |
| `DB_PORT` | `5432` |
| `DB_SSLMODE` | `require` |
| `FRONTEND_URL` | *(your Angular Vercel URL — add after frontend deploy)* |

5. Deploy → note the URL, e.g. `https://medi-search-api.vercel.app`

### Deploy the Frontend

1. Go to [vercel.com/new](https://vercel.com/new) again
2. Import the same repo — **Root Directory: leave empty (project root)**
3. Framework Preset: **Other**
4. Build Command: `npm run build:prod`
5. Output Directory: `dist/medi-search-dashboard/browser`
6. Add Environment Variable:
   - `NODE_OPTIONS` = `--max-old-space-size=4096`
7. **Before deploying**: update `src/environments/environment.prod.ts` — set `apiUrl` to your backend URL from step above
8. Push the change → Vercel auto-deploys

### Update CORS after both are deployed

Go to the **backend** Vercel project → Settings → Environment Variables  
Update `FRONTEND_URL` to your Angular Vercel URL → Redeploy backend.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/pharmacy/analytics?name=<name>` | Pharmacy traffic + drug trends |
| GET | `/api/analytics/pharmacy/low-stock` | Low stock alerts + stocking opportunities |
| GET | `/api/analytics/admin` | All admin data (ranking, trends, monthly) |
| GET | `/api/analytics/drug-search?name=<name>` | Drug price + availability stats |

---

## Project Structure

```
medi-search-dashboard/
├── BACK/                          ← Flask backend
│   ├── api/index.py               ← Vercel serverless entry point
│   ├── app/
│   │   ├── app.py                 ← Flask app + CORS
│   │   ├── database.py            ← Neon Postgres connection
│   │   ├── routes/                ← admin.py, pharmacy.py, search.py
│   │   ├── services/              ← business logic
│   │   └── queries/               ← SQL queries
│   ├── requirements.txt
│   └── vercel.json                ← Backend Vercel config
├── src/
│   ├── environments/
│   │   ├── environment.ts         ← dev (proxy to localhost:5000)
│   │   └── environment.prod.ts    ← prod (points to Vercel backend URL)
│   └── app/
│       ├── services/
│       │   └── dashboard.service.ts  ← all API calls
│       ├── features/
│       │   ├── pharmacy-dashboard/
│       │   ├── admin-dashboard/
│       │   ├── analytics-charts/
│       │   └── drug-detail-demo/
│       └── shared/components/
├── proxy.conf.json                ← dev proxy: /api/* → :5000
├── vercel.json                    ← Frontend Vercel config
└── angular.json
```
