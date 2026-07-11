from flask import Blueprint, jsonify, request
from services.search_service import get_drug_statistics, get_drug_suggestions

analytics = Blueprint("analytics", __name__)


@analytics.route("/api/analytics/drug-search")
def drug_search():
    """
    Search for a drug by name (partial match supported).
    GET /api/analytics/drug-search?name=pana  →  finds "Panadol Advance"
    """
    drug_name = request.args.get("name", "").strip()

    if not drug_name:
        return jsonify({"success": False, "message": "Drug name is required."}), 400

    result = get_drug_statistics(drug_name)

    if result is None:
        return jsonify({"success": False, "message": f"No drug found matching '{drug_name}'."}), 404

    return jsonify({"success": True, "data": result})


@analytics.route("/api/analytics/drug-suggestions")
def drug_suggestions():
    """
    Autocomplete endpoint — returns up to 10 drug names.
    GET /api/analytics/drug-suggestions?q=pana
    """
    query = request.args.get("q", "").strip()

    if len(query) < 2:
        return jsonify({"success": True, "suggestions": []})

    results = get_drug_suggestions(query)
    return jsonify({"success": True, "suggestions": results})
