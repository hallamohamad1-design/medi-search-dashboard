import sys
import os

# On Vercel, the function runs from the project root.
# includeFiles "BACK/app/**" copies those files alongside the function bundle.
# The working directory in Vercel serverless is the project root.
# Locally, __file__ = <project>/api/index.py, so parent = <project>.

_here = os.path.dirname(os.path.abspath(__file__))   # .../api/
_root = os.path.dirname(_here)                        # .../

# Try paths in order of likelihood
_candidates = [
    os.path.join(_root, 'BACK', 'app'),   # local dev
    os.path.join(_here, '..', 'BACK', 'app'),  # another local variant
    '/var/task/BACK/app',                  # Vercel Lambda runtime path
]

for _p in _candidates:
    _p = os.path.normpath(_p)
    if os.path.isdir(_p):
        sys.path.insert(0, _p)
        break
else:
    # Last resort: add BACK/app relative to cwd
    sys.path.insert(0, os.path.join(os.getcwd(), 'BACK', 'app'))

from app import app  # noqa: E402
