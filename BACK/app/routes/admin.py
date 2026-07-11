from flask import Blueprint
from flask import jsonify

from services.admin_service import get_admin_analytics

admin = Blueprint("admin", __name__)


@admin.route("/api/analytics/admin")
def admin_dashboard():

    result = get_admin_analytics()

    return jsonify({

        "success": True,

        "data": result

    })
