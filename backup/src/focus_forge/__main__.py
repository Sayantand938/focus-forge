#src/focus_forge/__main__.py
from .cli import app
from .db_utils import initialize_db
import logging
from pathlib import Path

# Define log directory and file path
HOME_DIR = Path.home()
LOG_DIR = HOME_DIR / ".focus-forge"
LOG_FILE = LOG_DIR / "focus-forge.log"
LOG_DIR.mkdir(parents=True, exist_ok=True)  # Ensure log dir exists

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename=LOG_FILE,
    filemode='a'
)

if __name__ == "__main__":
    initialize_db()
    app()



