# src/focus_forge/__main__.py
from .cli import app
from .db_utils import initialize_db  # Import remains
# import logging # Removed
from pathlib import Path # Remain
from .config import LOG_DIR, LOG_FILE, LOG_LEVEL  # Import configs #Removed LOG_LEVEL


if __name__ == "__main__":
    app()