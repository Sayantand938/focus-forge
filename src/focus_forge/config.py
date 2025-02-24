# # src/focus_forge/config.py
# from pathlib import Path

# HOME_DIR = Path.home()
# LOG_DIR = HOME_DIR / ".focus-forge"
# DB_DIR = HOME_DIR / ".focus-forge"
# DB_FILE = DB_DIR / "focus-forge.db"
# ID_MAPPING_FILE = DB_DIR / "id_mapping.json"
# LOG_LEVEL = "INFO"  # Example: You can set a default log level here


# src/focus_forge/config.py
from pathlib import Path

HOME_DIR = Path.home()
LOG_DIR = HOME_DIR / ".focus-forge"
DB_DIR = HOME_DIR / ".focus-forge"
DB_FILE = DB_DIR / "focus-forge.db"
ID_MAPPING_FILE = DB_DIR / "id_mapping.json"
LOG_LEVEL = "INFO"  # Example: You can set a default log level here

# Ensure directories exist
LOG_DIR.mkdir(parents=True, exist_ok=True)
DB_DIR.mkdir(parents=True, exist_ok=True)