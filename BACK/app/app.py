from flask import Flask
from flask_cors import CORS

from routes.pharmacy import pharmacy
from routes.search import analytics
from routes.admin import admin

app = Flask(__name__)

# Allow Angular dev server (port 4200) and any deployed frontend origin.
# Tighten origins= in production to your real domain.
CORS(app, origins=["http://localhost:4200", "http://127.0.0.1:4200"])

app.register_blueprint(analytics)
app.register_blueprint(pharmacy)
app.register_blueprint(admin)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
