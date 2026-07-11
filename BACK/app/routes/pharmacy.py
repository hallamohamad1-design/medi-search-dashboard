from flask import Blueprint, jsonify
from flask import request

from services.pharmacy_sevice import get_pharmacy_analytics

pharmacy = Blueprint("pharmacy", __name__)
from services.pharmacy_sevice import (
    get_low_stock_drugs,
    get_frequently_searched_missing_drugs
)



@pharmacy.route("/api/analytics/pharmacy/low-stock")
def low_stock():

    low_stock = get_low_stock_drugs()
    missing_drugs = get_frequently_searched_missing_drugs()

    return jsonify({
        "success": True,

        "low_stock_drugs": {
            "count": len(low_stock),
            "data": low_stock
        },

        "high_demand_missing_drugs": {
            "count": len(missing_drugs),
            "data": missing_drugs
        }
    })

@pharmacy.route("/api/analytics/pharmacy/analytics")
def pharmacy_dashboard():

    pharmacy_name = request.args.get("name")

    if not pharmacy_name:

        return jsonify({
            "success": False,
            "message": "Pharmacy name is required."
        }), 400

    result = get_pharmacy_analytics(pharmacy_name)

    if result is None:

        return jsonify({
            "success": False,
            "message": "Pharmacy not found."
        }), 404

    return jsonify({

        "success": True,

        "data": result

    })