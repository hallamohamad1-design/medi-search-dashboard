import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-please';
const SETUP_SECRET = process.env.SETUP_SECRET || 'setup-secret-change-me';

// Neon SSL Config
const dbConfig = {
  host: process.env.DB_HOST || "ep-wandering-hill-at0u1gzo-pooler.c-9.us-east-1.aws.neon.tech",
  database: process.env.DB_NAME || "neondb",
  user: process.env.DB_USER || "neondb_owner",
  password: process.env.DB_PASSWORD || "npg_i0N2XhQuEUYL",
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: {
    rejectUnauthorized: false
  }
};

const pool = new pg.Pool(dbConfig);

// Helper for cookie extraction
function getCookie(req, name) {
  if (!req.headers.cookie) return null;
  const parts = req.headers.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name + '=')) {
      return decodeURIComponent(trimmed.substring(name.length + 1));
    }
  }
  return null;
}

// Authentication middleware
function requireAuth(req, res, next) {
  let token = getCookie(req, 'session_token');
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized — invalid or expired token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized — invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden — admin only.' });
    }
    next();
  });
}

// Ensure database tables on startup
async function bootstrap() {
  const client = await pool.connect();
  try {
    console.log('[Bootstrap] Verifying table setup...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_users (
          id           SERIAL PRIMARY KEY,
          username     VARCHAR(100) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role         VARCHAR(20) NOT NULL DEFAULT 'pharmacy',
          pharmacy_id  INTEGER REFERENCES dim_pharmacy(pharmacy_id) ON DELETE SET NULL,
          created_at   TIMESTAMP DEFAULT NOW(),
          updated_at   TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[Bootstrap] dashboard_users table verified.');
  } catch (err) {
    console.error('[Bootstrap] Error during bootstrap:', err.message);
  } finally {
    client.release();
  }
}

// Run bootstrap asynchronously
bootstrap();

// CORS Headers for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ── Auth Endpoints ──────────────────────────────────────────────────────────

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const client = await pool.connect();
  try {
    const userResult = await client.query(`
      SELECT
          u.id,
          u.username,
          u.password_hash,
          u.role,
          u.pharmacy_id,
          dp.name        AS pharmacy_name,
          dp.is_active   AS pharmacy_active
      FROM dashboard_users u
      LEFT JOIN dim_pharmacy dp ON dp.pharmacy_id = u.pharmacy_id
      WHERE LOWER(u.username) = LOWER($1)
      LIMIT 1;
    `, [username.trim()]);

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const matched = await bcrypt.compare(password, user.password_hash);
    if (!matched) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    if (user.role === 'pharmacy') {
      if (!user.pharmacy_id) {
        return res.status(400).json({ success: false, message: 'This account is not linked to a pharmacy. Contact admin.' });
      }
      if (!user.pharmacy_active) {
        return res.status(403).json({ success: false, message: 'This pharmacy has been disabled. Contact admin.' });
      }
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      pharmacy_id: user.pharmacy_id,
      pharmacy_name: user.pharmacy_name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.cookie('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // development
      maxAge: 8 * 3600 * 1000,
    });

    return res.json({
      success: true,
      token,
      user: payload,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session_token');
  return res.json({ success: true });
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// POST /api/auth/setup
app.post('/api/auth/setup', async (req, res) => {
  const secret = req.headers['x-setup-secret'];
  if (secret !== SETUP_SECRET) {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_users (
          id           SERIAL PRIMARY KEY,
          username     VARCHAR(100) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role         VARCHAR(20) NOT NULL DEFAULT 'pharmacy',
          pharmacy_id  INTEGER REFERENCES dim_pharmacy(pharmacy_id) ON DELETE SET NULL,
          created_at   TIMESTAMP DEFAULT NOW(),
          updated_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Seed admin
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024!';
    const adminHashed = await bcrypt.hash(adminPassword, 10);
    await client.query(`
      INSERT INTO dashboard_users (username, password_hash, role, pharmacy_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `, ['admin', adminHashed, 'admin', null]);

    // 3. Seed pharmacies
    const pharmaciesResult = await client.query('SELECT pharmacy_id, name, is_active FROM dim_pharmacy ORDER BY name;');
    const seeded = [];

    for (const p of pharmaciesResult.rows) {
      const uname = p.name.toLowerCase().replace(/ /g, '_');
      const password = `Pharmacy@${p.pharmacy_id}`;
      const hashed = await bcrypt.hash(password, 10);

      await client.query(`
        INSERT INTO dashboard_users (username, password_hash, role, pharmacy_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
      `, [uname, hashed, 'pharmacy', p.pharmacy_id]);

      seeded.append ? seeded.push({ username: uname, pharmacy: p.name, default_password: password }) : seeded.push({ username: uname, pharmacy: p.name, default_password: password });
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: "Setup complete. Change all default passwords immediately.",
      admin_username: "admin",
      pharmacy_users: seeded,
      warning: "Default passwords are shown here ONCE. Store them securely.",
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Setup error:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/auth/pharmacies
app.get('/api/auth/pharmacies', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT pharmacy_id, name, is_active FROM dim_pharmacy ORDER BY name;');
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/auth/pharmacies/:id/toggle
app.post('/api/auth/pharmacies/:id/toggle', requireAdmin, async (req, res) => {
  const pharmacyId = req.params.id;
  const active = req.body.active === undefined ? true : !!req.body.active;

  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE dim_pharmacy
      SET is_active = $1
      WHERE pharmacy_id = $2
      RETURNING pharmacy_id, name, is_active;
    `, [active, pharmacyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Pharmacy ${pharmacyId} not found.` });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      warning: !active ? "is_active updated in dim_pharmacy. This may be overwritten by daily refresh." : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/auth/users
app.get('/api/auth/users', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
          u.id,
          u.username,
          u.role,
          u.pharmacy_id,
          dp.name       AS pharmacy_name,
          dp.is_active  AS pharmacy_active
      FROM dashboard_users u
      LEFT JOIN dim_pharmacy dp ON dp.pharmacy_id = u.pharmacy_id
      WHERE u.role = 'pharmacy'
      ORDER BY dp.name;
    `);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/auth/users
app.post('/api/auth/users', requireAdmin, async (req, res) => {
  const { username, password, role, pharmacy_id } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password are required.' });
  }

  const client = await pool.connect();
  try {
    const hashed = await bcrypt.hash(password, 10);
    await client.query(`
      INSERT INTO dashboard_users (username, password_hash, role, pharmacy_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username)
      DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role          = EXCLUDED.role,
          pharmacy_id   = EXCLUDED.pharmacy_id,
          updated_at    = NOW();
    `, [username.trim().toLowerCase(), hashed, role || 'pharmacy', pharmacy_id]);

    return res.json({ success: true, message: `User '${username}' saved.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Analytics Endpoints ─────────────────────────────────────────────────────

// GET /api/analytics/admin
app.get('/api/analytics/admin', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const rankingRes = await client.query(`
      SELECT
          dp.pharmacy_id,
          dp.name,
          SUM(fpv.number_of_views) AS total_views
      FROM fact_page_views fpv
      JOIN dim_pharmacy dp ON fpv.pharmacy_id = dp.pharmacy_id
      WHERE fpv.date_key >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY dp.pharmacy_id, dp.name
      ORDER BY total_views DESC;
    `);

    const areaTrendsRes = await client.query(`
      SELECT
          dl.governorate,
          dl.city,
          dd.drug_id,
          dd.name AS drug_name,
          SUM(fdt.number_of_searches) AS total_searches
      FROM fact_drug_trends fdt
      JOIN dim_location dl ON fdt.location_id = dl.location_id
      JOIN dim_drug dd ON fdt.drug_id = dd.drug_id
      WHERE fdt.date_key >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY dl.governorate, dl.city, dd.drug_id, dd.name
      ORDER BY dl.governorate, dl.city, total_searches DESC;
    `);

    const topDrugsRes = await client.query(`
      SELECT
          dd.drug_id,
          dd.name,
          SUM(fdt.number_of_searches) AS total_searches
      FROM fact_drug_trends fdt
      JOIN dim_drug dd ON fdt.drug_id = dd.drug_id
      WHERE fdt.date_key >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY dd.drug_id, dd.name
      ORDER BY total_searches DESC;
    `);

    const reportRes = await client.query(`
      SELECT
          dt.year,
          dt.month,
          dl.governorate,
          SUM(fdt.number_of_searches) AS total_searches
      FROM fact_drug_trends fdt
      JOIN dim_date dt ON fdt.date_key = dt.date_key
      JOIN dim_location dl ON fdt.location_id = dl.location_id
      GROUP BY dt.year, dt.month, dl.governorate
      ORDER BY dt.year, dt.month, total_searches DESC;
    `);

    return res.json({
      success: true,
      data: {
        pharmacy_ranking: rankingRes.rows,
        area_drug_trends: areaTrendsRes.rows,
        top_searched_drugs: topDrugsRes.rows,
        monthly_report: reportRes.rows
      }
    });
  } catch (err) {
    console.error('Admin analytics fetch failed:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/analytics/drug-search
app.get('/api/analytics/drug-search', async (req, res) => {
  const name = (req.query.name || '').trim();
  if (!name) {
    return res.status(400).json({ success: false, message: 'Drug name is required.' });
  }

  const client = await pool.connect();
  try {
    // 1. Try exact match
    let drugResult = await client.query('SELECT drug_id, name FROM dim_drug WHERE LOWER(name) = LOWER($1) LIMIT 1;', [name]);
    
    // 2. Fallback to partial match
    if (drugResult.rows.length === 0) {
      drugResult = await client.query(`
        SELECT drug_id, name
        FROM dim_drug
        WHERE LOWER(name) LIKE LOWER($1)
        ORDER BY
            CASE WHEN LOWER(name) LIKE LOWER($2) THEN 0 ELSE 1 END,
            LENGTH(name)
        LIMIT 1;
      `, [`%${name}%`, `${name}%`]);
    }

    if (drugResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: `No drug found matching '${name}'.` });
    }

    const drug = drugResult.rows[0];

    // Get statistics
    const statsResult = await client.query(`
      WITH latest_date AS (
          SELECT MAX(date_key) AS date_key
          FROM fact_inventory_snapshot
      ),
      drug_snapshot AS (
          SELECT
              f.pharmacy_id,
              f.price,
              f.quantity
          FROM fact_inventory_snapshot f
          JOIN latest_date ld ON f.date_key = ld.date_key
          WHERE f.drug_id = $1
      )
      SELECT
          ROUND(AVG(price)::numeric, 2)                             AS average_price,
          MAX(price)                                                AS highest_price,
          MIN(price)                                                AS lowest_price,
          COUNT(*) FILTER (WHERE quantity > 0)                      AS pharmacies_in_stock,
          COUNT(*)                                                  AS pharmacies_carrying_drug,
          ROUND(
              100.0 * COUNT(*) FILTER (WHERE quantity > 0)
              / NULLIF(COUNT(*), 0),
          1)                                                        AS availability_percentage
      FROM drug_snapshot;
    `, [drug.drug_id]);

    const stats = statsResult.rows[0];

    return res.json({
      success: true,
      data: {
        drug_id: drug.drug_id,
        drug_name: drug.name,
        average_price: stats.average_price || 0.00,
        highest_price: stats.highest_price || 0.00,
        lowest_price: stats.lowest_price || 0.00,
        pharmacies_in_stock: parseInt(stats.pharmacies_in_stock || '0'),
        pharmacies_carrying_drug: parseInt(stats.pharmacies_carrying_drug || '0'),
        availability_percentage: parseFloat(stats.availability_percentage || '0.0')
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/analytics/drug-suggestions
app.get('/api/analytics/drug-suggestions', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (query.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT drug_id, name
      FROM dim_drug
      WHERE LOWER(name) LIKE LOWER($1)
      ORDER BY
          CASE WHEN LOWER(name) LIKE LOWER($2) THEN 0 ELSE 1 END,
          LENGTH(name)
      LIMIT 10;
    `, [`%${query}%`, `${query}%`]);

    return res.json({ success: true, suggestions: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/analytics/pharmacy/low-stock
app.get('/api/analytics/pharmacy/low-stock', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const lowStockRes = await client.query(`
      WITH latest_date AS (SELECT MAX(date_key) AS date_key FROM fact_inventory_snapshot)
      SELECT dd.drug_id, dd.name, COUNT(*) FILTER (WHERE f.quantity > 0) AS pharmacies_in_stock
      FROM fact_inventory_snapshot f
      JOIN latest_date ld ON f.date_key = ld.date_key
      JOIN dim_drug dd ON dd.drug_id = f.drug_id
      GROUP BY dd.drug_id, dd.name
      HAVING COUNT(*) FILTER (WHERE f.quantity > 0) < 3
      ORDER BY pharmacies_in_stock ASC;
    `);

    const missingDrugsRes = await client.query(`
      WITH frequently_searched AS (
          SELECT
              fdt.drug_id,
              dl.city,
              dl.governorate,
              SUM(fdt.number_of_searches) AS total_searches
          FROM fact_drug_trends fdt
          JOIN dim_location dl ON fdt.location_id = dl.location_id
          WHERE fdt.date_key >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY fdt.drug_id, dl.city, dl.governorate
          HAVING SUM(fdt.number_of_searches) >= 1
      ),
      latest_inventory AS (
          SELECT drug_id, pharmacy_id, quantity
          FROM fact_inventory_snapshot
          WHERE date_key = (SELECT MAX(date_key) FROM fact_inventory_snapshot)
      )
      SELECT
          dp.pharmacy_id,
          dp.name AS pharmacy_name,
          fs.drug_id,
          dd.name AS drug_name,
          fs.city,
          fs.governorate,
          fs.total_searches
      FROM frequently_searched fs
      JOIN dim_pharmacy dp ON dp.city = fs.city AND dp.governorate = fs.governorate AND dp.is_active = TRUE
      JOIN dim_drug dd ON dd.drug_id = fs.drug_id
      LEFT JOIN latest_inventory li ON li.drug_id = fs.drug_id AND li.pharmacy_id = dp.pharmacy_id
      WHERE li.quantity IS NULL OR li.quantity = 0
      ORDER BY fs.total_searches DESC;
    `);

    return res.json({
      success: true,
      low_stock_drugs: {
        count: lowStockRes.rows.length,
        data: lowStockRes.rows
      },
      high_demand_missing_drugs: {
        count: missingDrugsRes.rows.length,
        data: missingDrugsRes.rows
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/analytics/pharmacy/:id/analytics
app.get('/api/analytics/pharmacy/:id/analytics', requireAuth, async (req, res) => {
  const pharmacyId = parseInt(req.params.id);
  const tokenPharmacyId = req.user.pharmacy_id;

  if (!tokenPharmacyId) {
    return res.status(400).json({ success: false, message: 'No pharmacy linked to this account.' });
  }

  if (tokenPharmacyId !== pharmacyId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: "Forbidden — you cannot view another pharmacy's data." });
  }

  const client = await pool.connect();
  try {
    const pharmacyRes = await client.query('SELECT pharmacy_id, name FROM dim_pharmacy WHERE pharmacy_id = $1 LIMIT 1;', [pharmacyId]);
    if (pharmacyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found.' });
    }

    const pageTrafficRes = await client.query(`
      SELECT
          dt.date_key,
          dt.day_name,
          fpv.number_of_views
      FROM fact_page_views fpv
      JOIN dim_date dt ON fpv.date_key = dt.date_key
      WHERE fpv.pharmacy_id = $1
      ORDER BY dt.date_key;
    `, [pharmacyId]);

    const drugTrendsRes = await client.query(`
      SELECT
          dd.drug_id,
          dd.name AS drug_name,
          SUM(fdt.number_of_searches) AS total_searches
      FROM fact_drug_trends fdt
      JOIN dim_drug dd ON fdt.drug_id = dd.drug_id
      WHERE fdt.date_key >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY dd.drug_id, dd.name
      ORDER BY total_searches DESC;
    `, []);

    return res.json({
      success: true,
      data: {
        pharmacy_id: pharmacyId,
        pharmacy_name: pharmacyRes.rows[0].name,
        page_traffic: pageTrafficRes.rows,
        drug_trends: drugTrendsRes.rows
      }
    });
  } catch (err) {
    console.error('Pharmacy dashboard stats fetch error:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[Local API Server] Running on http://localhost:${PORT}`);
});
