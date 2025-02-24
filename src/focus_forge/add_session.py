# src/focus_forge/add_session.py
import time
from datetime import datetime, timedelta
from .db_utils import start_session, stop_session, get_last_session, insert_session, check_for_overlap
# import logging # Removed
from pathlib import Path
from typing import Tuple, Union
import sqlite3

# logger = logging.getLogger(__name__) # Removed

def format_duration(seconds: Union[int, None]) -> str:
    if seconds is None:
        return "N/A"
    return str(timedelta(seconds=seconds))

def add_start_session() -> Tuple[bool, str]:
    current_date = datetime.now().strftime("%Y-%m-%d")
    start_time = datetime.now().strftime("%H:%M:%S")
    start_datetime = datetime.now()

    try:
        if check_for_overlap(current_date, start_datetime.strftime("%H:%M:%S")):
            return False, "New session overlaps with an existing session."

        insert_session(current_date, start_time)
        return True, f"Focus session started at {start_time}"

    except sqlite3.OperationalError as e:
        return False, "Database error: Please ensure the database is initialized." # More user friendly
    except Exception as e:
        return False, "An unexpected error occurred."

def add_stop_session() -> Tuple[bool, Union[int, None], str]:
    end_time = datetime.now().strftime("%H:%M:%S")
    end_datetime = datetime.now()
    current_date = datetime.now().strftime("%Y-%m-%d")
    yesterday_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    try:
        last_session = get_last_session()

        if not last_session:
            return False, None, "No session is currently running."

        start_time_str = last_session[2]
        start_datetime = datetime.strptime(f"{last_session[1]} {start_time_str}", "%Y-%m-%d %H:%M:%S")

        # Handle overnight session split
        if start_datetime.date() < end_datetime.date():
            # First entry (previous day till 23:59:59)
            first_duration = (datetime.combine(start_datetime.date(), datetime.max.time()) - start_datetime).total_seconds()
            insert_session(last_session[1], start_time_str, "23:59:59", int(first_duration))

            # Second entry (current day from 00:00:00 to end time)
            second_duration = (end_datetime - datetime.combine(end_datetime.date(), datetime.min.time())).total_seconds()
            insert_session(current_date, "00:00:00", end_time, int(second_duration))

            return True, None, f"1st Session added: {last_session[1]}, {start_time_str} - 23:59:59, Duration: {format_duration(int(first_duration))}\n" \
                                   f"2nd Session added: {current_date}, 00:00:00 - {end_time}, Duration: {format_duration(int(second_duration))}"

        duration = (end_datetime - start_datetime).total_seconds()
        duration_int = int(duration)
        duration_formatted = format_duration(duration_int)


        if check_for_overlap(last_session[1], start_datetime.strftime("%H:%M:%S"), end_datetime.strftime("%H:%M:%S"), last_session[0]):
            return False, None, "Session overlaps with an existing session."

        if stop_session(end_time, duration_int):
            return True, duration_int, f"Session stopped at {end_time}. Duration: {duration_formatted}"
        else:
            return False, None, "Failed to stop the session (database error)." # More concise
    except Exception as e:
        return False, None, "An unexpected error occurred."

def add_manual_session(time_range: str) -> Tuple[bool, str]:
    try:
        start_time_str, end_time_str = time_range.split(" - ")
        start_time = datetime.strptime(start_time_str, "%I:%M %p")
        end_time = datetime.strptime(end_time_str, "%I:%M %p")

        current_date = datetime.now().strftime("%Y-%m-%d")
        yesterday_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

        start_datetime = datetime.combine(datetime.today(), start_time.time())
        end_datetime = datetime.combine(datetime.today(), end_time.time())

        # Handle overnight session
        if start_datetime > end_datetime:
            if start_time.strftime("%p") == "PM" and end_time.strftime("%p") == "AM":
                # First entry (yesterday's date till 23:59:59)
                insert_session(yesterday_date, "23:00:00", "23:59:59", 3599)

                # Second entry (today's date from 00:00:00)
                duration = (end_datetime - datetime.combine(datetime.today(), datetime.min.time())).total_seconds()
                insert_session(current_date, "00:00:00", end_datetime.strftime("%H:%M:%S"), int(duration))

                return True, f"1st Session added: {yesterday_date}, 23:00:00 - 23:59:59, Duration: {format_duration(3599)}\n" \
                                   f"2nd Session added: {current_date}, 00:00:00 - {end_datetime.strftime('%H:%M:%S')}, Duration: {format_duration(int(duration))}"
            else:
                return False, "Invalid time range: End time must be later than start time on the same day."

        duration = (end_datetime - start_datetime).total_seconds()
        duration_int = int(duration)

        start_time_formatted = start_datetime.strftime("%H:%M:%S")
        end_time_formatted = end_datetime.strftime("%H:%M:%S")

        if check_for_overlap(current_date, start_time_formatted, end_time_formatted):
            return False, "New session overlaps with an existing session."

        insert_session(current_date, start_time_formatted, end_time_formatted, duration_int)
        return True, f"Session added: {current_date}, {start_time_formatted} - {end_time_formatted}, Duration: {format_duration(duration_int)}"

    except ValueError:
        return False, "Invalid time format. Use 'HH:MM AM/PM - HH:MM AM/PM'."
    except Exception as e:
        return False, "An unexpected error occurred."