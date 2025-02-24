# src/focus_forge/list_sessions.py

from rich.console import Console
from rich.table import Table
from .db_utils import fetch_all_data
from datetime import timedelta
from typing import Optional
import json
from .db_utils import ID_MAPPING_FILE, get_db_id


def format_duration(seconds):
    # Formats seconds as hh:mm:ss.  Handles None gracefully.
    if seconds is None:
        return "N/A"
    return str(timedelta(seconds=seconds))

def display_sessions(sort_by: Optional[str] = None, date: Optional[str] = None, since: Optional[str] = None, until: Optional[str] = None, month: Optional[str] = None):
    # Fetches and displays sessions.
    try:
        rows = fetch_all_data(sort_by=sort_by, date=date, since=since, until=until, month=month)

        if not rows:
            return "No sessions found."
        # Load ID mapping.
        with open(ID_MAPPING_FILE, 'r') as f:
            id_mapping = json.load(f)


        console = Console()
        table = Table(show_header=True, header_style="#fcba03")
        table.add_column("S.No", style="dim", justify="center")  # Show Serial Number
        table.add_column("Date", justify="center")
        table.add_column("Start Time", justify="center")
        table.add_column("End Time", justify="center")
        table.add_column("Duration", justify="center")

        for row in rows:
            # Find serial number using the database ID.
            serial_number = [k for k, v in id_mapping.items() if v == row[0]][0]
            end_time = row[3] if row[3] is not None else "N/A"  # Show "N/A" for ongoing sessions.
            duration_formatted = format_duration(row[4])
            table.add_row(str(serial_number), row[1], row[2], end_time, duration_formatted)  # Use serial number.


        console.print(table)
        return None  # Explicitly return None on success

    except Exception as e:
        return f"An error occurred: {e}"