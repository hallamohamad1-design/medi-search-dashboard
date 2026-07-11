"""
Auth SQL queries.

Schema created once via:
  POST /api/auth/setup  (admin-only, idempotent)

Tables live in the same Neon DB as the DW but are NOT part of the star schema
and are NOT touched by the daily refresh ETL.
"""

# ── Table creation (idempotent) ───────────────────────────────────────────────

CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS dashboard_users (
    id           SERIAL PRIMARY KEY,
    username     VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role         VARCHAR(20) NOT NULL DEFAULT 'pharmacy',  -- 'pharmacy' | 'admin'
    pharmacy_id  INTEGER REFERENCES dim_pharmacy(pharmacy_id) ON DELETE SET NULL,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);
"""

# ── Lookup ────────────────────────────────────────────────────────────────────

GET_USER_BY_USERNAME = """
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
WHERE u.username = %s
LIMIT 1;
"""

# ── User management (admin only) ──────────────────────────────────────────────

UPSERT_USER = """
INSERT INTO dashboard_users (username, password_hash, role, pharmacy_id)
VALUES (%s, %s, %s, %s)
ON CONFLICT (username)
DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role          = EXCLUDED.role,
    pharmacy_id   = EXCLUDED.pharmacy_id,
    updated_at    = NOW();
"""

LIST_PHARMACY_USERS = """
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
"""

# ── Pharmacy enable / disable ─────────────────────────────────────────────────
# Writes to dim_pharmacy.is_active directly.
# IMPORTANT: if the ETL refresh overwrites dim_pharmacy, this change persists
# only until the next load. The DW team should set is_active in the OLTP source
# so the next refresh carries it through. This is flagged in the API response.

SET_PHARMACY_ACTIVE = """
UPDATE dim_pharmacy
SET is_active = %s
WHERE pharmacy_id = %s
RETURNING pharmacy_id, name, is_active;
"""

GET_ALL_PHARMACIES = """
SELECT pharmacy_id, name, is_active
FROM dim_pharmacy
ORDER BY name;
"""
