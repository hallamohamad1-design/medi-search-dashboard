import sys
import os

# Add BACK/app to path so Flask imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'BACK', 'app'))

from app import app  # noqa
