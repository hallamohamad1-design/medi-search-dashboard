import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;

app.use(express.json());

// ── In-Memory Database Schema & State ──────────────────────────────────────

interface Pharmacy {
  pharmacy_id: number;
  name: string;
  is_active: boolean;
  city: string;
  governorate: string;
}

interface Drug {
  drug_id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'pharmacy';
  pharmacy_id: number | null;
}

// Seed static lists
const pharmacies: Pharmacy[] = [
  { pharmacy_id: 1, name: 'El Ezaby Pharmacy', is_active: true, city: 'Cairo', governorate: 'Cairo' },
  { pharmacy_id: 2, name: 'Sehha Pharmacy', is_active: true, city: 'Giza', governorate: 'Giza' },
  { pharmacy_id: 3, name: 'El Hazim Pharmacy', is_active: true, city: 'Alexandria', governorate: 'Alexandria' },
  { pharmacy_id: 4, name: 'Hind Pharmacy', is_active: true, city: 'Cairo', governorate: 'Cairo' },
];

const drugs: Drug[] = [
  { drug_id: 1, name: 'Panadol Advance' },
  { drug_id: 2, name: 'Augmentin 1g' },
  { drug_id: 3, name: 'Concor 5mg' },
  { drug_id: 4, name: 'Brufen 400mg' },
  { drug_id: 5, name: 'Cataflam 50mg' },
  { drug_id: 6, name: 'Ventolin Inhaler' },
  { drug_id: 7, name: 'Nexium 40mg' },
];

// Seed Users with bcrypt hashes
const users: User[] = [
  {
    id: 1,
    username: 'admin',
    password_hash: bcrypt.hashSync('Admin@2024!', 10),
    role: 'admin',
    pharmacy_id: null,
  },
  {
    id: 2,
    username: 'el_ezaby_pharmacy',
    password_hash: bcrypt.hashSync('Pharmacy@1', 10),
    role: 'pharmacy',
    pharmacy_id: 1,
  },
  {
    id: 3,
    username: 'sehha_pharmacy',
    password_hash: bcrypt.hashSync('Pharmacy@2', 10),
    role: 'pharmacy',
    pharmacy_id: 2,
  },
  {
    id: 4,
    username: 'el_hazim_pharmacy',
    password_hash: bcrypt.hashSync('Pharmacy@3', 10),
    role: 'pharmacy',
    pharmacy_id: 3,
  },
  {
    id: 5,
    username: 'hind_pharmacy',
    password_hash: bcrypt.hashSync('Pharmacy@4', 10),
    role: 'pharmacy',
    pharmacy_id: 4,
  },
];

// ── Dynamic Dynamic Data Generators ──────────────────────────────────────

const dates: { date_key: string; day_name: string; year: number; month: number }[] = [];
for (let i = 30; i >= 0; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const date_key = d.toISOString().split('T')[0];
  const day_name = d.toLocaleDateString('en-US', { weekday: 'long' });
  dates.push({
    date_key,
    day_name,
    year: d.getFullYear(),
    month: d.getMonth() + 1,
  });
}

// Generate Page Views
interface PageView {
  date_key: string;
  pharmacy_id: number;
  number_of_views: number;
}
const pageViews: PageView[] = [];
dates.forEach((dt) => {
  const isWeekend = dt.day_name === 'Friday' || dt.day_name === 'Saturday';
  pharmacies.forEach((p) => {
    let baseViews = 100;
    if (p.pharmacy_id === 1) baseViews = 220;
    if (p.pharmacy_id === 4) baseViews = 180;
    if (p.pharmacy_id === 2) baseViews = 130;

    const rand = Math.floor(Math.random() * 50);
    const viewMultiplier = isWeekend ? 0.75 : 1.1;
    pageViews.push({
      date_key: dt.date_key,
      pharmacy_id: p.pharmacy_id,
      number_of_views: Math.floor((baseViews + rand) * viewMultiplier),
    });
  });
});

// Generate Inventories (snapshots for latest date)
interface Inventory {
  date_key: string;
  drug_id: number;
  pharmacy_id: number;
  price: number;
  quantity: number;
}
const latestDateKey = dates[dates.length - 1].date_key;
const inventorySnapshots: Inventory[] = [];

// Populating inventories
const drugPrices: Record<number, number> = {
  1: 45.0, // Panadol
  2: 120.0, // Augmentin
  3: 75.0, // Concor
  4: 35.0, // Brufen
  5: 55.0, // Cataflam
  6: 150.0, // Ventolin
  7: 230.0, // Nexium
};

pharmacies.forEach((p) => {
  drugs.forEach((d) => {
    let quantity = 100 + Math.floor(Math.random() * 200);

    // Mock low stock & out of stock to align with query logic
    if (d.drug_id === 6) {
      // Ventolin Inhaler is low stock system-wide (only 2 pharmacies carry it with >0 stock)
      if (p.pharmacy_id === 1 || p.pharmacy_id === 2) {
        quantity = 0;
      } else {
        quantity = 5;
      }
    }
    if (d.drug_id === 7) {
      // Nexium 40mg is low stock system-wide
      if (p.pharmacy_id === 3 || p.pharmacy_id === 4) {
        quantity = 0;
      } else {
        quantity = 2;
      }
    }
    if (d.drug_id === 2 && p.pharmacy_id === 4) {
      // Augmentin is missing in Hind Pharmacy (Cairo)
      quantity = 0;
    }

    inventorySnapshots.push({
      date_key: latestDateKey,
      drug_id: d.drug_id,
      pharmacy_id: p.pharmacy_id,
      price: drugPrices[d.drug_id],
      quantity,
    });
  });
});

// Generate Search Trends (last 30 days)
interface SearchTrend {
  date_key: string;
  drug_id: number;
  location_id: number; // 1: Cairo, 2: Giza, 3: Alexandria
  number_of_searches: number;
}
const searchTrends: SearchTrend[] = [];
dates.forEach((dt) => {
  drugs.forEach((d) => {
    [1, 2, 3].forEach((locId) => {
      let baseSearches = 15;
      if (d.drug_id === 1) baseSearches = 60; // Panadol highly searched
      if (d.drug_id === 6) baseSearches = 45; // Ventolin highly searched
      if (d.drug_id === 2) baseSearches = 30; // Augmentin moderately searched

      const rand = Math.floor(Math.random() * 20);
      searchTrends.push({
        date_key: dt.date_key,
        drug_id: d.drug_id,
        location_id: locId,
        number_of_searches: baseSearches + rand,
      });
    });
  });
});

// ── Auth & Cookies Support Helpers ──────────────────────────────────────────

function getCookie(req: express.Request, name: string): string | null {
  const rc = req.headers.cookie;
  if (!rc) return null;
  const list: Record<string, string> = {};
  rc.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join('='));
    }
  });
  return list[name] || null;
}

// Manual JWT encoder/decoder compliant with frontend atob payload extraction
function makeToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadStr = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 8 * 3600, // 8 hours
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64url');
  return `${header}.${payloadStr}.mocked_signature`;
}

function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// ── Auth Middlewares ────────────────────────────────────────────────────────

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  (req as any).user = {
    id: 1,
    sub: '1',
    username: 'admin',
    role: 'admin',
    pharmacy_id: null,
    pharmacy_name: null,
  };
  next();
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  (req as any).user = {
    id: 1,
    sub: '1',
    username: 'admin',
    role: 'admin',
    pharmacy_id: null,
    pharmacy_name: null,
  };
  next();
};

// ── REST API Router Endpoints ───────────────────────────────────────────────

// 1. POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }

  const linkedPharmacy = pharmacies.find((p) => p.pharmacy_id === user.pharmacy_id);
  if (user.role === 'pharmacy') {
    if (!linkedPharmacy) {
      return res.status(400).json({ success: false, message: 'This account is not linked to a pharmacy. Contact admin.' });
    }
    if (!linkedPharmacy.is_active) {
      return res.status(403).json({ success: false, message: 'This pharmacy has been disabled. Contact admin.' });
    }
  }

  const tokenPayload = {
    id: user.id,
    sub: String(user.id),
    username: user.username,
    role: user.role,
    pharmacy_id: user.pharmacy_id,
    pharmacy_name: linkedPharmacy ? linkedPharmacy.name : null,
  };

  const token = makeToken(tokenPayload);
  res.cookie('session_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // Local preview environment
    maxAge: 8 * 3600 * 1000,
  });

  return res.json({
    success: true,
    token,
    user: tokenPayload,
  });
});

// 2. POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session_token');
  return res.json({ success: true });
});

// 3. GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ success: true, user: (req as any).user });
});

// 4. POST /api/auth/setup (Idempotent bootstrap)
app.post('/api/auth/setup', (req, res) => {
  const secret = req.headers['x-setup-secret'];
  const SETUP_SECRET = process.env['SETUP_SECRET'] || 'setup-secret-change-me';
  if (secret !== SETUP_SECRET) {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }

  // Set default admin password
  const adminUser = users.find((u) => u.username === 'admin');
  const adminPassword = process.env['ADMIN_PASSWORD'] || 'Admin@2024!';
  if (adminUser) {
    adminUser.password_hash = bcrypt.hashSync(adminPassword, 10);
  }

  const seeded = pharmacies.map((p) => {
    const uname = p.name.toLowerCase().replace(/ /g, '_');
    const password = `Pharmacy@${p.pharmacy_id}`;
    const existing = users.find((u) => u.username === uname);
    if (!existing) {
      users.push({
        id: users.length + 1,
        username: uname,
        password_hash: bcrypt.hashSync(password, 10),
        role: 'pharmacy',
        pharmacy_id: p.pharmacy_id,
      });
    } else {
      existing.password_hash = bcrypt.hashSync(password, 10);
    }
    return { username: uname, pharmacy: p.name, default_password: password };
  });

  return res.json({
    success: true,
    message: 'Setup complete. Change all default passwords immediately.',
    admin_username: 'admin',
    pharmacy_users: seeded,
    warning: 'Default passwords are shown here ONCE. Store them securely.',
  });
});

// 5. GET /api/auth/pharmacies
app.get('/api/auth/pharmacies', requireAdmin, (req, res) => {
  return res.json({ success: true, data: pharmacies });
});

// 6. POST /api/auth/pharmacies/:id/toggle
app.post('/api/auth/pharmacies/:id/toggle', requireAdmin, (req, res) => {
  const pharmacyId = parseInt(req.params['id'], 10);
  const { active } = req.body;

  const target = pharmacies.find((p) => p.pharmacy_id === pharmacyId);
  if (!target) {
    return res.status(404).json({ success: false, message: `Pharmacy ${pharmacyId} not found.` });
  }

  target.is_active = active === undefined ? true : Boolean(active);
  return res.json({
    success: true,
    data: target,
    warning: !target.is_active
      ? 'is_active updated. This change may be overwritten by the next daily ETL refresh. Update your OLTP source to make it permanent.'
      : null,
  });
});

// 7. GET /api/auth/users
app.get('/api/auth/users', requireAdmin, (req, res) => {
  const mappedUsers = users
    .filter((u) => u.role === 'pharmacy')
    .map((u) => {
      const p = pharmacies.find((ph) => ph.pharmacy_id === u.pharmacy_id);
      return {
        id: u.id,
        username: u.username,
        role: u.role,
        pharmacy_id: u.pharmacy_id,
        pharmacy_name: p ? p.name : null,
        pharmacy_active: p ? p.is_active : false,
      };
    });
  return res.json({ success: true, data: mappedUsers });
});

// 8. POST /api/auth/users
app.post('/api/auth/users', requireAdmin, (req, res) => {
  const { username, password, role, pharmacy_id } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password are required.' });
  }

  const uname = username.trim().toLowerCase();
  const existingIndex = users.findIndex((u) => u.username === uname);
  const passwordHash = bcrypt.hashSync(password, 10);

  if (existingIndex >= 0) {
    users[existingIndex].password_hash = passwordHash;
    users[existingIndex].role = role || 'pharmacy';
    users[existingIndex].pharmacy_id = pharmacy_id || null;
  } else {
    users.push({
      id: users.length + 1,
      username: uname,
      password_hash: passwordHash,
      role: role || 'pharmacy',
      pharmacy_id: pharmacy_id || null,
    });
  }

  return res.json({ success: true, message: `User '${uname}' saved.` });
});

// 9. GET /api/analytics/pharmacy/:id/analytics
app.get('/api/analytics/pharmacy/:id/analytics', requireAuth, (req, res) => {
  const pharmacyId = parseInt(req.params['id'], 10);

  const p = pharmacies.find((ph) => ph.pharmacy_id === pharmacyId);
  if (!p) {
    return res.status(404).json({ success: false, message: 'Pharmacy not found.' });
  }

  // Filter traffic for this pharmacy
  const traffic = pageViews.filter((pv) => pv.pharmacy_id === pharmacyId);

  // Return drug search trends (grouped by drug, sum of searches across all Cairo/Alexandria locations)
  const drugSearchesMap: Record<number, number> = {};
  searchTrends.forEach((st) => {
    drugSearchesMap[st.drug_id] = (drugSearchesMap[st.drug_id] || 0) + st.number_of_searches;
  });

  const drugTrends = Object.keys(drugSearchesMap).map((drugIdStr) => {
    const drugId = parseInt(drugIdStr, 10);
    const drugObj = drugs.find((dr) => dr.drug_id === drugId);
    return {
      drug_id: drugId,
      drug_name: drugObj ? drugObj.name : 'Unknown Drug',
      total_searches: drugSearchesMap[drugId],
    };
  }).sort((a, b) => b.total_searches - a.total_searches);

  return res.json({
    success: true,
    data: {
      pharmacy_id: pharmacyId,
      pharmacy_name: p.name,
      page_traffic: traffic,
      drug_trends: drugTrends,
    },
  });
});

// 10. GET /api/analytics/pharmacy/low-stock
app.get('/api/analytics/pharmacy/low-stock', requireAuth, (req, res) => {
  // Low Stock Drugs definition: Count of pharmacies where qty > 0 is less than 3
  const lowStockList = drugs.map((d) => {
    const snapshots = inventorySnapshots.filter((snap) => snap.drug_id === d.drug_id && snap.quantity > 0);
    return {
      drug_id: d.drug_id,
      name: d.name,
      pharmacies_in_stock: snapshots.length,
    };
  }).filter((x) => x.pharmacies_in_stock < 3)
    .sort((a, b) => a.pharmacies_in_stock - b.pharmacies_in_stock);

  // High Demand Missing Drugs: searched >= 1 in a location (city) but that location's pharmacy has qty = 0 or missing
  // Let's gather searches grouped by drug & city
  const searchSum: Record<string, { drug_id: number; city: string; governorate: string; searches: number }> = {};
  searchTrends.forEach((st) => {
    const loc = st.location_id === 1 ? { city: 'Cairo', gov: 'Cairo' } : (st.location_id === 2 ? { city: 'Giza', gov: 'Giza' } : { city: 'Alexandria', gov: 'Alexandria' });
    const key = `${st.drug_id}:${loc.city}`;
    if (!searchSum[key]) {
      searchSum[key] = {
        drug_id: st.drug_id,
        city: loc.city,
        governorate: loc.gov,
        searches: 0,
      };
    }
    searchSum[key].searches += st.number_of_searches;
  });

  const missingList: any[] = [];
  Object.values(searchSum).forEach((fs) => {
    const drugObj = drugs.find((dr) => dr.drug_id === fs.drug_id);
    if (!drugObj) return;

    // Find active pharmacies in this city
    const localPharmacies = pharmacies.filter((p) => p.city === fs.city && p.is_active);
    localPharmacies.forEach((p) => {
      const inv = inventorySnapshots.find((snap) => snap.drug_id === fs.drug_id && snap.pharmacy_id === p.pharmacy_id);
      if (!inv || inv.quantity === 0) {
        missingList.push({
          pharmacy_id: p.pharmacy_id,
          pharmacy_name: p.name,
          drug_id: fs.drug_id,
          drug_name: drugObj.name,
          city: fs.city,
          governorate: fs.governorate,
          total_searches: fs.searches,
        });
      }
    });
  });

  const sortedMissing = missingList.sort((a, b) => b.total_searches - a.total_searches);

  return res.json({
    success: true,
    low_stock_drugs: {
      count: lowStockList.length,
      data: lowStockList,
    },
    high_demand_missing_drugs: {
      count: sortedMissing.length,
      data: sortedMissing,
    },
  });
});

// 11. GET /api/analytics/admin
app.get('/api/analytics/admin', requireAdmin, (req, res) => {
  // Pharmacy Traffic Ranking
  const rankingMap: Record<number, number> = {};
  pageViews.forEach((pv) => {
    rankingMap[pv.pharmacy_id] = (rankingMap[pv.pharmacy_id] || 0) + pv.number_of_views;
  });
  const pharmacyRanking = pharmacies.map((p) => ({
    pharmacy_id: p.pharmacy_id,
    name: p.name,
    total_views: rankingMap[p.pharmacy_id] || 0,
  })).sort((a, b) => b.total_views - a.total_views);

  // Area Drug Trends
  const areaTrendsMap: Record<string, { governorate: string; city: string; drug_id: number; drug_name: string; total_searches: number }> = {};
  searchTrends.forEach((st) => {
    const loc = st.location_id === 1 ? { city: 'Cairo', gov: 'Cairo' } : (st.location_id === 2 ? { city: 'Giza', gov: 'Giza' } : { city: 'Alexandria', gov: 'Alexandria' });
    const drugObj = drugs.find((dr) => dr.drug_id === st.drug_id);
    const key = `${loc.city}:${st.drug_id}`;
    if (!areaTrendsMap[key]) {
      areaTrendsMap[key] = {
        governorate: loc.gov,
        city: loc.city,
        drug_id: st.drug_id,
        drug_name: drugObj ? drugObj.name : 'Unknown',
        total_searches: 0,
      };
    }
    areaTrendsMap[key].total_searches += st.number_of_searches;
  });
  const areaDrugTrends = Object.values(areaTrendsMap).sort((a, b) => b.total_searches - a.total_searches);

  // Top Searched Drugs
  const topSearchedMap: Record<number, number> = {};
  searchTrends.forEach((st) => {
    topSearchedMap[st.drug_id] = (topSearchedMap[st.drug_id] || 0) + st.number_of_searches;
  });
  const topSearchedDrugs = drugs.map((d) => ({
    drug_id: d.drug_id,
    name: d.name,
    total_searches: topSearchedMap[d.drug_id] || 0,
  })).sort((a, b) => b.total_searches - a.total_searches);

  // Monthly report
  const monthlyReportMap: Record<string, { year: number; month: number; governorate: string; total_searches: number }> = {};
  searchTrends.forEach((st) => {
    const dateInfo = dates.find((dt) => dt.date_key === st.date_key);
    if (!dateInfo) return;
    const loc = st.location_id === 1 ? { gov: 'Cairo' } : (st.location_id === 2 ? { gov: 'Giza' } : { gov: 'Alexandria' });
    const key = `${dateInfo.year}:${dateInfo.month}:${loc.gov}`;
    if (!monthlyReportMap[key]) {
      monthlyReportMap[key] = {
        year: dateInfo.year,
        month: dateInfo.month,
        governorate: loc.gov,
        total_searches: 0,
      };
    }
    monthlyReportMap[key].total_searches += st.number_of_searches;
  });
  const monthlyReport = Object.values(monthlyReportMap).sort((a, b) => b.total_searches - a.total_searches);

  return res.json({
    success: true,
    data: {
      pharmacy_ranking: pharmacyRanking,
      area_drug_trends: areaDrugTrends,
      top_searched_drugs: topSearchedDrugs,
      monthly_report: monthlyReport,
    },
  });
});

// 12. GET /api/analytics/drug-search
app.get('/api/analytics/drug-search', (req, res) => {
  const name = (req.query['name'] as string || '').trim().toLowerCase();
  if (!name) {
    return res.status(400).json({ success: false, message: 'Drug name is required.' });
  }

  // Exact Match
  let drug = drugs.find((d) => d.name.toLowerCase() === name);
  if (!drug) {
    // Partial Fallback
    drug = drugs.find((d) => d.name.toLowerCase().includes(name));
  }

  if (!drug) {
    return res.status(404).json({ success: false, message: `No drug found matching '${name}'.` });
  }

  const snapshots = inventorySnapshots.filter((snap) => snap.drug_id === drug!.drug_id);
  const prices = snapshots.map((s) => s.price);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0.0;
  const inStockCount = snapshots.filter((s) => s.quantity > 0).length;

  return res.json({
    success: true,
    data: {
      drug_name: drug.name,
      drug_id: drug.drug_id,
      statistics: {
        average_price: parseFloat(avgPrice.toFixed(2)),
        highest_price: prices.length ? Math.max(...prices) : 0.0,
        lowest_price: prices.length ? Math.min(...prices) : 0.0,
        pharmacies_in_stock: inStockCount,
        pharmacies_carrying_drug: snapshots.length,
        availability_percentage: snapshots.length ? parseFloat((100.0 * inStockCount / snapshots.length).toFixed(1)) : 0.0,
      },
    },
  });
});

// 13. GET /api/analytics/drug-suggestions
app.get('/api/analytics/drug-suggestions', (req, res) => {
  const q = (req.query['q'] as string || '').trim().toLowerCase();
  if (q.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  const matched = drugs
    .filter((d) => d.name.toLowerCase().includes(q))
    .slice(0, 10)
    .map((d) => ({ drug_id: d.drug_id, name: d.name }));

  return res.json({ success: true, suggestions: matched });
});

// ── Serve Static Compiled Angular Client SPA ────────────────────────────────

const browserDistFolder = path.join(process.cwd(), 'dist', 'medi-search-dashboard', 'browser');

// Serve static assets with high-performance caching but prevent caching of index.html
app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// SPA fallback with disabled caching to guarantee immediate updates on refresh
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(browserDistFolder, 'index.html'));
});

// ── Launch Server ────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});
