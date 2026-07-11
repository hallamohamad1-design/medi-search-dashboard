from flask import Flask
from routes.pharmacy import pharmacy
from routes.search import analytics
from routes.admin import admin

app = Flask(__name__)

app.register_blueprint(analytics)
app.register_blueprint(pharmacy)
app.register_blueprint(admin)

if __name__ == "__main__":
    app.run(debug=True)