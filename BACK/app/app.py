import os
import re
from flask import Flask, request

from routes.pharmacy import pharmacy
from routes.search import analytics
from routes.admin import admin
from routes.auth import auth_bp

app = Flask(__name__)

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(analytics)
app.register_blueprint(pharmacy)
app.register_blueprint(admin)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
