# src/focus_forge/add_session.py
import time
from datetime import datetime, timedelta
from .db_utils import start_session, stop_session, get_last_session, insert_session, check_for_overlap
import logging
from pathlib import Path


logger = logging.getLogger(__name__)  # No basicConfig here

def format_duration(seconds):
    """Formats seconds as hh:mm:ss.  Handles None gracefully."""
    if seconds is None:
        return "N/A"
    return str(timedelta(seconds=seconds))

def add_start_session():
    """Adds a new session to the database, logs the start time, and informs the user."""
    current_date = datetime.now().strftime("%Y-%m-%d")
    start_time = datetime.now().strftime("%H:%M:%S")
    start_datetime = datetime.now()

    try:
        # Check if a session is already running
        if get_last_session():
            logger.warning("A session is already running. Please stop it first.")
            return False, "A session is already running. Please stop it first."

        # Check for overlaps
        if check_for_overlap(current_date, start_datetime.strftime("%H:%M:%S")):
            logger.warning("New session overlaps with an existing session.")
            return False, "New session overlaps with an existing session."

        insert_session(current_date, start_time)
        logger.info(f"Session started on {current_date} at {start_time}")
        return True, f"Focus session started at {start_time}"

    except Exception as e:
        logger.error(f"An error occurred while starting the session: {e}")
        return False, "An error occurred while starting the session."



def add_stop_session():
    """Stops the current session, calculates duration, and informs the user."""
    end_time = datetime.now().strftime("%H:%M:%S")
    end_datetime = datetime.now()
    try:
        last_session = get_last_session()  # Get the running session

        if not last_session:
            return False, None, "No session is currently running."

        start_time_str = last_session[2]
        start_datetime = datetime.strptime(f"{last_session[1]} {start_time_str}", "%Y-%m-%d %H:%M:%S")

        duration = (end_datetime - start_datetime).total_seconds()
        duration_int = int(duration)
        duration_formatted = format_duration(duration_int)

         # Check for overlaps.  This shouldn't normally happen, but it's a good safety check.
        if check_for_overlap(last_session[1], start_datetime.strftime("%H:%M:%S"), end_datetime.strftime("%H:%M:%S"), last_session[0]):
            logger.warning("Session overlaps with an existing session.")
            return False, None, "Session overlaps with an existing session."


        if stop_session(end_time, duration_int):
            logger.info(f"Session stopped at {end_time}. Duration: {duration_formatted} ")
            return True, duration_int, f"Session stopped at {end_time}. Duration: {duration_formatted}"
        else:
            logger.error("Failed to stop session (database error).")
            return False, None, "Failed to stop the session (database error)."
    except Exception as e:
        logger.error(f"An error occurred while stopping the session: {e}")
        return False, None, "An error occurred while stopping the session."


def add_manual_session(time_range: str):
    """Adds a session with a manually specified start and end time."""
    try:
        start_time_str, end_time_str = time_range.split(" - ")
        start_time = datetime.strptime(start_time_str, "%I:%M %p")
        end_time = datetime.strptime(end_time_str, "%I:%M %p")
        current_date = datetime.now().strftime("%Y-%m-%d")

        start_datetime = datetime.combine(datetime.today(), start_time.time())
        end_datetime = datetime.combine(datetime.today(), end_time.time())

        # Handle sessions spanning midnight
        if end_datetime < start_datetime:
            end_datetime += timedelta(days=1)

        if end_datetime <= start_datetime:
            return False, "End time cannot be before or equal to start time."

        duration = (end_datetime - start_datetime).total_seconds()
        duration_int = int(duration)


        start_time_formatted = start_datetime.strftime("%H:%M:%S")
        end_time_formatted = end_datetime.strftime("%H:%M:%S")

        # Check for overlapping sessions
        if check_for_overlap(current_date, start_time_formatted, end_time_formatted):
            return False, "New session overlaps with an existing session."

        insert_session(current_date, start_time_formatted, end_time_formatted, duration_int)
        logger.info(f"Session added: {current_date}, {start_time_formatted} - {end_time_formatted}, Duration: {format_duration(duration_int)}")
        return True, f"Session added: {current_date}, {start_time_formatted} - {end_time_formatted}, Duration: {format_duration(duration_int)}"

    except ValueError:
        return False, "Invalid time format. Use 'HH:MM AM/PM - HH:MM AM/PM'."
    except Exception as e:
        logger.error(f"An error occurred: {e}")  # Keep this - it's a more general error
        return False, f"An error occurred: {e}"




