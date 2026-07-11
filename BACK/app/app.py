import os
from flask import Flask
from flask_cors import CORS

from routes.pharmacy import pharmacy
from routes.search import analytics
from routes.admin import admin

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Angular frontend origins.
# In production the FRONTEND_URL env var should be set on Vercel to the
# deployed Angular URL, e.g. https://medi-search-dashboard.vercel.app
allowed_origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

frontend_url = os.environ.get("FRONTEND_URL", "")
if frontend_url:
    allowed_origins.append(frontend_url)

CORS(app, origins=allowed_origins, supports_credentials=True)

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(analytics)
app.register_blueprint(pharmacy)
app.register_blueprint(admin)

# ── Local dev entry-point ─────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
