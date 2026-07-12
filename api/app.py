import os
from flask import Flask
from flask_cors import CORS

from routes.pharmacy import pharmacy
from routes.search import analytics
from routes.admin import admin
from routes.auth import auth_bp

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
# On Vercel: frontend and API are on the same domain, so CORS is only needed
# for local development. The env var CORS_ORIGINS can override defaults.
_cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:4200,http://127.0.0.1:4200"
).split(",")

CORS(
    app,
    origins=_cors_origins,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "Accept"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)

# ── Secret key (used by Flask session / cookie signing) ──────────────────────
app.config["SECRET_KEY"] = os.environ.get("JWT_SECRET", "change-me-in-production")

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(analytics)
app.register_blueprint(pharmacy)
app.register_blueprint(admin)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
