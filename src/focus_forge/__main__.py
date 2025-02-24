# #src/focus_forge/__main__.py
# from .cli import app
# from .db_utils import initialize_db
# import logging
# from pathlib import Path

# # Define log directory and file path
# HOME_DIR = Path.home()
# LOG_DIR = HOME_DIR / ".focus-forge"
# LOG_FILE = LOG_DIR / "focus-forge.log"
# LOG_DIR.mkdir(parents=True, exist_ok=True)  # Ensure log dir exists

# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(levelname)s - %(message)s',
#     filename=LOG_FILE,
#     filemode='a'
# )

# if __name__ == "__main__":
#     app()



# src/focus_forge/__main__.py
#src/focus_forge/__main__.py
from .cli import app
from .db_utils import initialize_db
import logging
from pathlib import Path
from .config import LOG_DIR, LOG_FILE, LOG_LEVEL #Import configs

# Define log directory and file path
# HOME_DIR = Path.home() #Removed
# LOG_DIR = HOME_DIR / ".focus-forge" #Removed
# LOG_FILE = LOG_DIR / "focus-forge.log" #Removed
# LOG_DIR.mkdir(parents=True, exist_ok=True)  # Ensure log dir exists #Removed

logging.basicConfig(
    level=logging.getLevelName(LOG_LEVEL), # Use config
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename=LOG_FILE,
    filemode='a'
)

if __name__ == "__main__":
    app()