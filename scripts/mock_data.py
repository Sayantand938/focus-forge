# scripts/mock_data.py
import logging
import random
from datetime import datetime, timedelta
from typing import List, Tuple
import typer
import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))


from focus_forge.db_utils import insert_session, initialize_db  # Import initialize_db


logger = logging.getLogger(__name__)

# Create a new Typer app *just for this script*
app = typer.Typer()

def generate_daily_sessions(current_date: datetime) -> List[Tuple[str, str, str, int]]:
    """
    Generates study sessions for a given day.
    """
    start_time = current_date.replace(hour=8, minute=0, second=0)  # 8:00 AM
    end_time_limit = current_date.replace(hour=23, minute=45, second=0)  # 11:45 PM
    sessions: List[Tuple[str, str, str, int]] = []

    while start_time < end_time_limit:
        session_duration = timedelta(minutes=random.randint(20, 40))
        if start_time + session_duration > end_time_limit:
            break
        session_end_time = start_time + session_duration
        sessions.append((
            current_date.strftime('%Y-%m-%d'),
            start_time.strftime('%H:%M:%S'),
            session_end_time.strftime('%H:%M:%S'),
            int(session_duration.total_seconds())
        ))
        gap_duration = timedelta(minutes=random.randint(30, 45))
        start_time = session_end_time + gap_duration
    return sessions


def generate_mock_data(start_date_str: str, end_date_str: str):
    """Generates and inserts mock data."""
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    except ValueError:
        logger.error("Invalid date format. Use YYYY-MM-DD.")
        return

    if end_date < start_date:
        logger.error("End date cannot be before start date.")
        return

    current_date = start_date
    while current_date <= end_date:
        sessions = generate_daily_sessions(current_date)
        for session in sessions:
            insert_session(*session)
        current_date += timedelta(days=1)
    logger.info(f"Generated mock data from {start_date_str} to {end_date_str}")


@app.command()
def main(
    start_date: str = typer.Option(..., prompt="Enter start date (YYYY-MM-DD)"),
    end_date: str = typer.Option(..., prompt="Enter end date (YYYY-MM-DD)"),
):
    """Generates mock data and populates the database."""
    initialize_db()  # <--- CALL initialize_db() HERE
    generate_mock_data(start_date, end_date)


if __name__ == "__main__":
    app()