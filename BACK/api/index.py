"""
Vercel serverless entry point for the Flask app.
Vercel's Python runtime looks for a callable named `app` in api/index.py.
"""
import sys
import os

# Add the parent BACK/app directory to the Python path so all imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app'))

from app import app  # noqa: E402  (imported after sys.path manipulation)
