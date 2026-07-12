from flask import Blueprint, jsonify
from services.admin_service import get_admin_analytics
from routes.auth import require_admin

admin = Blueprint("admin", __name__)


@admin.route("/api/analytics/admin")
@require_admin
def admin_dashboard():
    """Admin-only: full system analytics."""
    result = get_admin_analytics()
    return jsonify({"success": True, "data": result})
