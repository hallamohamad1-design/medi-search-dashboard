from flask import Blueprint, jsonify, request
from services.pharmacy_sevice import (
    get_pharmacy_analytics_by_id,
    get_low_stock_drugs,
    get_frequently_searched_missing_drugs,
)
from routes.auth import require_auth, require_admin

pharmacy = Blueprint("pharmacy", __name__)


@pharmacy.route("/api/analytics/pharmacy/low-stock")
@require_auth
def low_stock():
    """
    Low-stock alerts.
    Pharmacy users see system-wide low stock (useful for stocking decisions).
    """
    low_stock_data = get_low_stock_drugs()
    missing_drugs  = get_frequently_searched_missing_drugs()

    return jsonify({
        "success": True,
        "low_stock_drugs": {
            "count": len(low_stock_data),
            "data":  low_stock_data,
        },
        "high_demand_missing_drugs": {
            "count": len(missing_drugs),
            "data":  missing_drugs,
        },
    })


@pharmacy.route("/api/analytics/pharmacy/<int:pharmacy_id>/analytics")
@require_auth
def pharmacy_dashboard(pharmacy_id: int):
    """
    Pharmacy dashboard analytics.
    pharmacy_id is verified against the JWT token to ensure scoping.
    """
    user        = request.user
    token_pharmacy_id = user.get("pharmacy_id")

    if not token_pharmacy_id:
        return jsonify({"success": False, "message": "No pharmacy linked to this account."}), 400
        
    if token_pharmacy_id != pharmacy_id:
        return jsonify({"success": False, "message": "Forbidden — you cannot view another pharmacy's data."}), 403

    result = get_pharmacy_analytics_by_id(pharmacy_id)

    if result is None:
        return jsonify({"success": False, "message": "Pharmacy not found."}), 404

    return jsonify({"success": True, "data": result})
