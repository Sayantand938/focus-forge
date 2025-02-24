# src/focus_forge/leaderboard.py
from rich.console import Console
from rich.table import Table
from .db_utils import fetch_all_data, update_or_insert_leaderboard, get_leaderboard_data
from .session_summary import format_duration
from datetime import date
import random
from typing import List, Dict

def display_leaderboard():
    """Calculates, displays, and saves the leaderboard."""
    today = date.today().strftime("%Y-%m-%d")
    rows = fetch_all_data(date=today)

    # Get Sayantan's total duration for today.
    sayantan_duration = 0
    for row in rows:
        if row[4] is not None:  # Consider only completed sessions.
            sayantan_duration += row[4]

    # Check if leaderboard data already exists for today.
    db_leaderboard_data = get_leaderboard_data(today)

    if not db_leaderboard_data:  # Only generate if no data exists
        # Create leaderboard data.
        leaderboard_data: List[Dict] = [{"name": "Sayantan", "duration": sayantan_duration}]

        # Add other names with random durations.
        other_names = [
            "Amelia Winslow", "Florence Spencer", "Beatrice Hamilton", "Ivy Lancaster",
            "Henry Whitmore", "William Prescott", "Charlotte Sinclair", "James Harrington",
            "Sebastian Holloway", "Eleanor Hastings", "Theodore Beckett", "Oliver",
            "Arthur Caldwell", "Rosalind Ashford"
        ]
        for name in other_names:
            # Generate random duration between 6 and 9 hours (in seconds).
            random_duration = random.randint(6 * 3600, 9 * 3600)
            leaderboard_data.append({"name": name, "duration": random_duration})
         # Sort by duration in descending order (for saving to db).
        leaderboard_data.sort(key=lambda x: x["duration"], reverse=True)

        # Save to database.
        for data in leaderboard_data:
            update_or_insert_leaderboard(today, data["name"], data["duration"])
        #get the data from db
        db_leaderboard_data = get_leaderboard_data(today)

    # Always update Sayantan's duration.
    update_or_insert_leaderboard(today, "Sayantan", sayantan_duration)
    #get updated data
    db_leaderboard_data = get_leaderboard_data(today)

    # Add ranks and create the table
    console = Console()
    table = Table(show_header=True, header_style="#fcba03")
    table.add_column("Rank", justify="center")
    table.add_column("Name", justify="left")
    table.add_column("Duration", justify="center")

    for i, (name, duration) in enumerate(db_leaderboard_data, start=1):
        table.add_row(str(i), name, format_duration(duration))

    console.print(table)
    return None