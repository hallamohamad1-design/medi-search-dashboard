import os
import psycopg2
from psycopg2.extras import RealDictCursor

# ── Connection config ─────────────────────────────────────────────────────────
# Values are read from environment variables first (production / Vercel).
# The hard-coded strings are fallbacks for local development only.
# On Vercel: set these in Project → Settings → Environment Variables.

DB_CONFIG = {
    "host":     os.environ.get("DB_HOST",     "ep-wandering-hill-at0u1gzo-pooler.c-9.us-east-1.aws.neon.tech"),
    "database": os.environ.get("DB_NAME",     "neondb"),
    "user":     os.environ.get("DB_USER",     "neondb_owner"),
    "password": os.environ.get("DB_PASSWORD", "npg_i0N2XhQuEUYL"),
    "port":     os.environ.get("DB_PORT",     "5432"),
    # Neon requires SSL
    "sslmode":  os.environ.get("DB_SSLMODE",  "require"),
}


def get_connection():
    return psycopg2.connect(
        host=DB_CONFIG["host"],
        database=DB_CONFIG["database"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        port=DB_CONFIG["port"],
        sslmode=DB_CONFIG["sslmode"],
        cursor_factory=RealDictCursor,
    )
