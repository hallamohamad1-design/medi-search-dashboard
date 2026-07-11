from flask import Blueprint
from flask import jsonify
from flask import request

from services.search_service import get_drug_statistics

analytics = Blueprint("analytics", __name__)


@analytics.route("/api/analytics/drug-search")
def drug_search():

    drug_name = request.args.get("name")

    if not drug_name:

        return jsonify({
            "success": False,
            "message": "Drug name is required."
        }), 400

    result = get_drug_statistics(drug_name)

    if result is None:

        return jsonify({
            "success": False,
            "message": "Drug not found."
        }), 404

    return jsonify({
        "success": True,
        "data": result
    })