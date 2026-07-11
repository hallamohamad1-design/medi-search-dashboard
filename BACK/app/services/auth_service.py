"""
Auth service — password hashing, token generation, credential verification.
Uses bcrypt for password hashing and PyJWT for stateless tokens.
"""
import os
import datetime
import bcrypt
import jwt

from database import get_connection
from queries.auth_queries import (
    CREATE_USERS_TABLE,
    GET_USER_BY_USERNAME,
    UPSERT_USER,
    LIST_PHARMACY_USERS,
    SET_PHARMACY_ACTIVE,
    GET_ALL_PHARMACIES,
)

JWT_SECRET  = os.environ.get("JWT_SECRET", "change-me-in-production-please")
JWT_ALG     = "HS256"
JWT_EXPIRES = datetime.timedelta(hours=8)  # token valid 8 hours


# ── Table bootstrap ───────────────────────────────────────────────────────────

def ensure_tables():
    """Create auth tables if they don't exist. Idempotent."""
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(CREATE_USERS_TABLE)
        conn.commit()
    finally:
        cur.close()
        conn.close()


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


# ── JWT helpers ───────────────────────────────────────────────────────────────

def make_token(user_id: int, username: str, role: str, pharmacy_id) -> str:
    payload = {
        "sub":         str(user_id),
        "username":    username,
        "role":        role,
        "pharmacy_id": pharmacy_id,
        "exp":         datetime.datetime.utcnow() + JWT_EXPIRES,
        "iat":         datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    """Returns payload dict or raises jwt.ExpiredSignatureError / jwt.InvalidTokenError."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])


# ── Login ─────────────────────────────────────────────────────────────────────

def login(username: str, password: str):
    """
    Returns (token, user_info) on success, or raises ValueError on failure.
    Checks:
      1. Username exists
      2. Password matches hash
      3. If pharmacy user → pharmacy.is_active must be True
    """
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(GET_USER_BY_USERNAME, (username.strip().lower(),))
        user = cur.fetchone()
    finally:
        cur.close()
        conn.close()

    if user is None:
        raise ValueError("Invalid username or password.")

    if not verify_password(password, user["password_hash"]):
        raise ValueError("Invalid username or password.")

    # Pharmacy accounts must belong to an active pharmacy
    if user["role"] == "pharmacy":
        if not user["pharmacy_id"]:
            raise ValueError("This account is not linked to a pharmacy. Contact admin.")
        if not user["pharmacy_active"]:
            raise ValueError("This pharmacy has been disabled. Contact admin.")

    token = make_token(user["id"], user["username"], user["role"], user["pharmacy_id"])

    return token, {
        "id":            user["id"],
        "username":      user["username"],
        "role":          user["role"],
        "pharmacy_id":   user["pharmacy_id"],
        "pharmacy_name": user["pharmacy_name"],
    }


# ── Admin: manage pharmacy users ─────────────────────────────────────────────

def create_or_update_user(username: str, password: str, role: str, pharmacy_id):
    """Create or update a user. Passwords are always hashed."""
    hashed = hash_password(password)
    conn   = get_connection()
    cur    = conn.cursor()
    try:
        cur.execute(UPSERT_USER, (username.strip().lower(), hashed, role, pharmacy_id))
        conn.commit()
    finally:
        cur.close()
        conn.close()


def list_pharmacy_users():
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(LIST_PHARMACY_USERS)
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


def set_pharmacy_active(pharmacy_id: int, active: bool):
    """
    Toggle is_active on dim_pharmacy.
    WARNING: this may be overwritten by the next daily ETL refresh.
    The OLTP source table should be updated to make this permanent.
    """
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(SET_PHARMACY_ACTIVE, (active, pharmacy_id))
        result = cur.fetchone()
        conn.commit()
        return result
    finally:
        cur.close()
        conn.close()


def get_all_pharmacies():
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(GET_ALL_PHARMACIES)
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()
