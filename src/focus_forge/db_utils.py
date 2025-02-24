# src/focus_forge/db_utils.py

import sqlite3
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import Optional
import re
import json
from .config import DB_FILE, ID_MAPPING_FILE, DB_DIR

def initialize_db():
    # Initialize the database and create the table if it doesn't exist.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS focus_forge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            duration INTEGER
        )
    """)
    conn.commit()
    conn.close()

def clear_db():
    # Removes all data from the database. FOR TESTING ONLY.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM focus_forge")
    conn.commit()
    conn.close()
    update_id_mapping()  # Clear the ID mapping.

def start_session(current_date, start_time):
    # Starts a new focus session, with no end time or duration.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO focus_forge (date, start_time, end_time, duration)
        VALUES (?, ?, NULL, NULL)
    """, (current_date, start_time))
    conn.commit()
    conn.close()
    update_id_mapping()  # Update serial numbers.

def insert_session(date, start_time, end_time=None, duration=None):
    # Inserts a session. Used for starting, stopping, and manual entries.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO focus_forge (date, start_time, end_time, duration)
        VALUES (?, ?, ?, ?)
    """, (date, start_time, end_time, duration))
    conn.commit()
    conn.close()
    update_id_mapping()  # Update serial numbers.

def stop_session(end_time, duration):
    # Stops the current focus session by updating the last entry.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE focus_forge
        SET end_time = ?, duration = ?
        WHERE id = (SELECT MAX(id) FROM focus_forge WHERE end_time IS NULL)
    """, (end_time, duration))
    conn.commit()
    conn.close()
    # Return True if a row was actually updated, False otherwise.
    if cursor.rowcount == 0:
        return False
    return True

def get_last_session():
    # Retrieves the last session, used to check if a session is running.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM focus_forge WHERE end_time IS NULL ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return row

def _validate_date(date_str: str, date_format:str = "%Y-%m-%d"):
    # Validates that the string is a valid date.
    try:
        datetime.strptime(date_str, date_format)
        return True
    except ValueError:
        return False

def _validate_time(time_str: str) -> bool:
    # Validates time format using regex.
    return bool(re.match(r"^\d{2}:\d{2}:\d{2}$", time_str))


def fetch_all_data(sort_by: Optional[str] = None, date: Optional[str] = None, since: Optional[str] = None, until: Optional[str] = None, month: Optional[str] = None):
    # Fetch all data with optional sorting and filtering.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    query = "SELECT id, date, start_time, end_time, duration FROM focus_forge"
    conditions = []
    params = []

    # Build WHERE clause based on filters.
    if date:
        conditions.append("date = ?")
        params.append(date)  # date is already validated.
    elif month:
        conditions.append("strftime('%Y-%m', date) = ?")
        params.append(month)
    elif since or until:
        if since:
            if len(since) == 4: # year only YYYY
              conditions.append("strftime('%Y', date) >= ?")
            elif len(since) == 7: # year and month YYYY-MM
              conditions.append("strftime('%Y-%m', date) >= ?")
            else: #full date
              conditions.append("date >= ?")
            params.append(since)

        if until:
            if len(until) == 4:
                conditions.append("strftime('%Y', date) <= ?")
            elif len(until) == 7:
                conditions.append("strftime('%Y-%m', date) <= ?")
            else:
                conditions.append("date <= ?")
            params.append(until)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    # Add ORDER BY clause.
    if sort_by:
        if sort_by == "date":
            query += " ORDER BY date ASC"
        elif sort_by == "date-desc":
            query += " ORDER BY date DESC"
        elif sort_by == "start-time":
            query += " ORDER BY start_time ASC"
        elif sort_by == "start-time-desc":
            query += " ORDER BY start_time DESC"
        elif sort_by == "duration":
            query += " ORDER BY duration DESC"
        elif sort_by == "duration-desc":
            query += " ORDER BY duration ASC"
        else: #default case
           query += " ORDER BY date ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return rows

def delete_session(session_id: int):
    # Deletes a session by its ID.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Check if session exists.
    cursor.execute("SELECT * FROM focus_forge WHERE id = ?", (session_id,))
    if cursor.fetchone() is None:
        conn.close()
        return False, f"Session with ID {session_id} not found."

    cursor.execute("DELETE FROM focus_forge WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

    if cursor.rowcount > 0:
        update_id_mapping()  # Update serial numbers after deletion.
        return True, f"Session with ID {session_id} deleted successfully."
    else:
        return False, f"Failed to delete session with ID {session_id}."

def check_for_overlap(date_str: str, start_time_str: str, end_time_str: Optional[str] = None, session_id: Optional[int] = None) -> bool:
    # Checks if a given time range overlaps with existing sessions.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    start_datetime = datetime.strptime(f"{date_str} {start_time_str}", "%Y-%m-%d %H:%M:%S")

    # If no end time, check if start_time falls within any existing session.
    if end_time_str is None:
        query = """
            SELECT 1 FROM focus_forge
            WHERE date = ? AND start_time <= ? AND (end_time > ? OR end_time IS NULL)
        """
        params = (date_str, start_time_str, start_time_str)
        if session_id:
            query += " AND id != ?"  # Exclude the session being updated.
            params += (session_id,)

        cursor.execute(query, params)
        result = cursor.fetchone()
        conn.close()
        return result is not None

    # If end time is provided, check for any overlaps.
    end_datetime = datetime.strptime(f"{date_str} {end_time_str}", "%Y-%m-%d %H:%M:%S")
    query = """
    SELECT 1
    FROM focus_forge
    WHERE date = ?
    AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
    )
    """
    params = (date_str, start_time_str, start_time_str, end_time_str, end_time_str, start_time_str, end_time_str)

    if session_id:
        query += " AND id != ?"  # Exclude the session being updated.
        params += (session_id,)

    cursor.execute(query, params)
    result = cursor.fetchone()
    conn.close()
    return result is not None  # True if overlap exists, False otherwise.

def get_session_by_id(session_id: int):
    # Retrieves a session by its ID.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM focus_forge WHERE id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    return row

def edit_session(session_id: int, new_date: Optional[str] = None, new_start_time: Optional[str] = None, new_end_time: Optional[str] = None):
    # Edits an existing session's date/times.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    session = get_session_by_id(session_id)
    if not session:
        return False, f"Session with ID {session_id} not found."

    _, original_date, original_start_time, original_end_time, _ = session

    # Use original values if new values are not provided.
    updated_date = new_date if new_date is not None else original_date
    updated_start_time = new_start_time if new_start_time is not None else original_start_time
    updated_end_time = new_end_time if new_end_time is not None else original_end_time

    # Validate the new values.
    if new_date and not _validate_date(updated_date):
         return False, f"Invalid date format: {updated_date}. Use YYYY-MM-DD."

    if new_start_time and not _validate_time(updated_start_time):
        return False, f"Invalid start time format: {updated_start_time}. Use HH:MM:SS."

    if new_end_time and not _validate_time(updated_end_time):
        return False, f"Invalid end time format: {updated_end_time}. Use HH:MM:SS."

    try:
        # Construct datetime objects.  Handle cases where only one of start/end is updated.
        if updated_start_time and updated_end_time:
            start_datetime = datetime.strptime(f"{updated_date} {updated_start_time}", "%Y-%m-%d %H:%M:%S")
            end_datetime = datetime.strptime(f"{updated_date} {updated_end_time}", "%Y-%m-%d %H:%M:%S")
        elif updated_start_time:
            start_datetime = datetime.strptime(f"{updated_date} {updated_start_time}", "%Y-%m-%d %H:%M:%S")
            end_datetime = datetime.strptime(f"{updated_date} {original_end_time}", "%Y-%m-%d %H:%M:%S")
        elif updated_end_time:
            start_datetime = datetime.strptime(f"{updated_date} {original_start_time}", "%Y-%m-%d %H:%M:%S")
            end_datetime = datetime.strptime(f"{updated_date} {updated_end_time}", "%Y-%m-%d %H:%M:%S")
        elif new_date:
            start_datetime = datetime.strptime(f"{updated_date} {original_start_time}", "%Y-%m-%d %H:%M:%S")
            end_datetime = datetime.strptime(f"{updated_date} {original_end_time}", "%Y-%m-%d %H:%M:%S")
        else:
            return True, "No changes made to the session."

        if updated_start_time and updated_end_time:
            if start_datetime >= end_datetime:
                return False, "Start time cannot be after or equal to end time."

        elif updated_start_time:
             if start_datetime >= datetime.strptime(f"{updated_date} {original_end_time}", "%Y-%m-%d %H:%M:%S"):
                return False, "Start time cannot be after or equal to the original end time."

        #Check for the overnight session
        if end_datetime < start_datetime:
            end_datetime += timedelta(days=1)

        if end_datetime <= start_datetime:
            return False, "End time cannot be before or equal to start time."

        duration = int((end_datetime - start_datetime).total_seconds())

    except ValueError as e:
        return False, f"Error processing time values: {e}"

    # Check for overlaps *before* updating.  Exclude current session from check.
    if check_for_overlap(updated_date, updated_start_time, updated_end_time, session_id):
        return False, "Updated session overlaps with an existing session."

    # Perform the update.
    cursor.execute("""
        UPDATE focus_forge
        SET date = ?, start_time = ?, end_time = ?, duration = ?
        WHERE id = ?
    """, (updated_date, updated_start_time, updated_end_time, duration, session_id))

    conn.commit()
    conn.close()

    if cursor.rowcount > 0:
        update_id_mapping()  # Update serial numbers after editing.
        return True, f"Session with ID {session_id} updated successfully."
    else:
        return False, f"Failed to update session with ID {session_id} (database error)."

def update_id_mapping(sort_by: Optional[str] = None, date: Optional[str] = None, since: Optional[str] = None, until: Optional[str] = None, month: Optional[str] = None):
    # Updates id_mapping.json with database entries.
    try:
        if Path(ID_MAPPING_FILE).exists():
            with open(ID_MAPPING_FILE, 'r') as f:
                id_mapping = json.load(f)
        else:
            id_mapping = {}

        rows = fetch_all_data(sort_by=sort_by, date=date, since=since, until=until, month=month)
        new_mapping = {}
        for serial_num, row in enumerate(rows, start=1):
            db_id = row[0]  # Database ID is the first element.
            new_mapping[str(serial_num)] = db_id #string type serial number and database id.

        with open(ID_MAPPING_FILE, 'w') as f:
            json.dump(new_mapping, f, indent=4)

    except Exception as e:
        print(f"Error updating ID mapping: {e}")

def get_db_id(serial_number: int) -> int:
    # Retrieves the database ID for a given serial number.
    try:
        with open(ID_MAPPING_FILE, 'r') as f:
            id_mapping = json.load(f)
        db_id = id_mapping.get(str(serial_number))
        if db_id is None:
            raise ValueError(f"Invalid serial number: {serial_number}.  No matching session found.")
        return db_id
    except FileNotFoundError:
        raise ValueError("ID mapping file not found.  Run 'list' to generate it.")
    except Exception as e:
        raise  # Re-raise other exceptions.