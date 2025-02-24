# src/focus_forge/__init__.py
__version__ = "0.1.0"  # Match the version in pyproject.toml

from .db_utils import initialize_db

# Initialize the database when the package is imported.
initialize_db()