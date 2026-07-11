import os
import re
from flask import Flask, request
from flask_cors import CORS

from routes.pharmacy import pharmacy
from routes.search import analytics
from routes.admin import admin
from routes.auth import auth_bp

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
def is_allowed_origin(origin):
    if not origin:
        return False
    patterns = [
        r"^http://localhost(:\d+)?$",
        r"^http://127\.0\.0\.1(:\d+)?$",
        r"^https://medi-search-dashboard\.vercel\.app$",
        r"^https://medi-search-da.*\.vercel\.app$",
        r"^https://medi-search-dashboard.*\.vercel\.app$",
    ]
    return any(re.match(p, origin) for p in patterns)

@app.after_request
def add_cors(response):
    origin = request.headers.get("Origin", "")
    if is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"]      = origin
        response.headers["Access-Control-Allow-Headers"]     = "Content-Type,Authorization,Accept,X-Setup-Secret"
        response.headers["Access-Control-Allow-Methods"]     = "GET,POST,OPTIONS"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        from flask import make_response
        origin = request.headers.get("Origin", "")
        res = make_response()
        if is_allowed_origin(origin):
            res.headers["Access-Control-Allow-Origin"]      = origin
            res.headers["Access-Control-Allow-Headers"]     = "Content-Type,Authorization,Accept,X-Setup-Secret"
            res.headers["Access-Control-Allow-Methods"]     = "GET,POST,OPTIONS"
            res.headers["Access-Control-Max-Age"]           = "86400"
        return res, 204

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(analytics)
app.register_blueprint(pharmacy)
app.register_blueprint(admin)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
