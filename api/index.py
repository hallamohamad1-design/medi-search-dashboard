import sys
import os

# Vercel bundles 'includeFiles' relative to the function file (api/index.py).
# At runtime the BACK/app directory is accessible from the project root.
# We try multiple path strategies so it works both on Vercel and locally.

_here = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_here)

candidates = [
    os.path.join(_root, 'BACK', 'app'),   # local  → <project>/BACK/app
    os.path.join(_here, 'BACK', 'app'),   # vercel → api/BACK/app  (fallback)
    os.path.join(_root, 'app'),           # edge case
]

for p in candidates:
    if os.path.isdir(p):
        sys.path.insert(0, p)
        break

from app import app  # noqa
