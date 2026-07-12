"""
Auth routes:
  POST /api/auth/login          — public
  GET  /api/auth/me             — requires valid JWT
  POST /api/auth/setup          — admin only: bootstrap tables + seed admin user
  GET  /api/auth/pharmacies     — admin only: list all pharmacies
  POST /api/auth/users          — admin only: create/update a pharmacy user
  GET  /api/auth/users          — admin only: list pharmacy users
  POST /api/auth/pharmacies/<id>/toggle — admin only: enable/disable a pharmacy
"""
import os
import functools

import jwt
from flask import Blueprint, jsonify, request

from services.auth_service import (
    ensure_tables,
    login,
    decode_token,
    create_or_update_user,
    list_pharmacy_users,
    set_pharmacy_active,
    get_all_pharmacies,
    hash_password,
)

auth_bp = Blueprint("auth", __name__)

SETUP_SECRET = os.environ.get("SETUP_SECRET", "setup-secret-change-me")


# ── Token extraction helper ───────────────────────────────────────────────────

def get_token_payload():
    """Extract and decode token from cookie."""
    token = request.cookies.get("session_token")
    if not token:
        # Fallback to Bearer just in case
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header[7:]
    if not token:
        return None
    try:
        return decode_token(token)
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ── Auth decorators ───────────────────────────────────────────────────────────

def require_auth(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        payload = get_token_payload()
        if payload is None:
            return jsonify({"success": False, "message": "Unauthorized — invalid or expired token."}), 401
        request.user = payload
        return f(*args, **kwargs)
    return wrapper


def require_admin(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        payload = get_token_payload()
        if payload is None:
            return jsonify({"success": False, "message": "Unauthorized."}), 401
        if payload.get("role") != "admin":
            return jsonify({"success": False, "message": "Forbidden — admin only."}), 403
        request.user = payload
        return f(*args, **kwargs)
    return wrapper


# ── Public routes ─────────────────────────────────────────────────────────────

@auth_bp.route("/api/auth/login", methods=["POST"])
def auth_login():
    """
    POST /api/auth/login
    Body: { "username": "...", "password": "..." }
    Returns: { "success": true, "token": "...", "user": { ... } }
    """
    body = request.get_json(silent=True) or {}
    username = body.get("username", "").strip()
    password = body.get("password", "")

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."}), 400

    try:
        token, user_info = login(username, password)
        res = jsonify({"success": True, "token": token, "user": user_info})
        res.set_cookie("session_token", token, httponly=True, samesite="Strict", secure=True)
        return res
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 401

@auth_bp.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    """Logs the user out by clearing the session cookie."""
    res = jsonify({"success": True})
    res.delete_cookie("session_token")
    return res


@auth_bp.route("/api/auth/me")
@require_auth
def auth_me():
    """Returns the current user's info from their token."""
    return jsonify({"success": True, "user": request.user})


# ── Admin: one-time setup ─────────────────────────────────────────────────────

@auth_bp.route("/api/auth/setup", methods=["POST"])
def auth_setup():
    """
    Idempotent bootstrap:
      1. Creates dashboard_users table
      2. Seeds a default admin user (username: admin, password from ADMIN_PASSWORD env)
      3. Seeds one user per pharmacy in dim_pharmacy
    Requires X-Setup-Secret header matching SETUP_SECRET env var.
    """
    secret = request.headers.get("X-Setup-Secret", "")
    if secret != SETUP_SECRET:
        return jsonify({"success": False, "message": "Forbidden."}), 403

    ensure_tables()

    # Seed admin user
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@2024!")
    create_or_update_user("admin", admin_password, "admin", None)

    # Seed one user per pharmacy: username = lowercase(name), password = Pharmacy@<id>
    pharmacies = get_all_pharmacies()
    seeded = []
    for p in pharmacies:
        uname    = p["name"].lower().replace(" ", "_")
        password = f"Pharmacy@{p['pharmacy_id']}"
        create_or_update_user(uname, password, "pharmacy", p["pharmacy_id"])
        seeded.append({"username": uname, "pharmacy": p["name"], "default_password": password})

    return jsonify({
        "success": True,
        "message": "Setup complete. Change all default passwords immediately.",
        "admin_username": "admin",
        "pharmacy_users": seeded,
        "warning": "Default passwords are shown here ONCE. Store them securely.",
    })


# ── Admin: pharmacy management ────────────────────────────────────────────────

@auth_bp.route("/api/auth/pharmacies")
@require_admin
def list_pharmacies():
    """List all pharmacies with is_active status."""
    pharmacies = get_all_pharmacies()
    return jsonify({"success": True, "data": pharmacies})


@auth_bp.route("/api/auth/pharmacies/<int:pharmacy_id>/toggle", methods=["POST"])
@require_admin
def toggle_pharmacy(pharmacy_id: int):
    """
    Enable or disable a pharmacy.
    Body: { "active": true | false }
    NOTE: writes to dim_pharmacy.is_active directly in Neon.
    This may be overwritten by the next daily ETL refresh — update your OLTP
    source table to make the change permanent.
    """
    body   = request.get_json(silent=True) or {}
    active = bool(body.get("active", True))

    result = set_pharmacy_active(pharmacy_id, active)
    if result is None:
        return jsonify({"success": False, "message": f"Pharmacy {pharmacy_id} not found."}), 404

    return jsonify({
        "success": True,
        "data": result,
        "warning": (
            "is_active updated in dim_pharmacy. "
            "This change may be overwritten by the next daily ETL refresh. "
            "Update your OLTP source to make it permanent."
        ) if not active else None,
    })


@auth_bp.route("/api/auth/users")
@require_admin
def get_users():
    """List all pharmacy dashboard users."""
    users = list_pharmacy_users()
    return jsonify({"success": True, "data": users})


@auth_bp.route("/api/auth/users", methods=["POST"])
@require_admin
def create_user():
    """
    Create or update a pharmacy user.
    Body: { "username": "...", "password": "...", "role": "pharmacy", "pharmacy_id": 1 }
    """
    body = request.get_json(silent=True) or {}
    username    = body.get("username", "").strip().lower()
    password    = body.get("password", "")
    role        = body.get("role", "pharmacy")
    pharmacy_id = body.get("pharmacy_id")

    if not username or not password:
        return jsonify({"success": False, "message": "username and password are required."}), 400
    if role not in ("pharmacy", "admin"):
        return jsonify({"success": False, "message": "role must be 'pharmacy' or 'admin'."}), 400

    create_or_update_user(username, password, role, pharmacy_id)
    return jsonify({"success": True, "message": f"User '{username}' saved."})
