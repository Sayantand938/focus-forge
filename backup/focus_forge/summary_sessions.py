# src/focus_forge/summary_sessions.py
import logging
from rich.console import Console
from rich.table import Table
from .db_utils import fetch_all_data
from typing import Optional, Dict, Any, Callable
from collections import defaultdict
import re

logger = logging.getLogger(__name__)

def format_duration(seconds):
    """Formats seconds as hh:mm:ss, handling durations > 24 hours."""
    if seconds is None:
        return "N/A"

    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02}"

def parse_duration(duration_str: str) -> int:
    """Parses a duration string (e.g., '2h30m', '150m', '9000s') into seconds."""
    match = re.match(r"^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$", duration_str)
    if not match:
        raise ValueError(f"Invalid duration format: {duration_str}")

    hours, minutes, seconds = match.groups()
    total_seconds = 0
    if hours:
        total_seconds += int(hours) * 3600
    if minutes:
        total_seconds += int(minutes) * 60
    if seconds:
        total_seconds += int(seconds)

    return total_seconds


def calculate_summary(sort_by: Optional[str] = None, date: Optional[str] = None, since: Optional[str] = None, until: Optional[str] = None, month: Optional[str] = None, status_filter: Optional[str] = None,
                      average_filter: Optional[str] = None, total_filter: Optional[str] = None):  # Added filter parameters
    """Calculates and displays the summary of focus sessions."""
    rows = fetch_all_data(sort_by=None, date=date, since=since, until=until, month=month)  # Don't pre-sort here.

    if not rows:
        return "No sessions found to summarize."

    daily_data = defaultdict(lambda: {"total_duration": 0, "count": 0})
    for row in rows:
        date_str = row[1]
        duration = row[4] if row[4] is not None else 0
        daily_data[date_str]["total_duration"] += duration
        daily_data[date_str]["count"] += 1

    summary_data = []
    for date_str, data in daily_data.items():
        avg_duration = data["total_duration"] // data["count"]
        total_duration = data["total_duration"]
        calculated_status = "[green][bold]Passed[/bold][/green]" if total_duration >= 8 * 3600 else "[red][bold]Failed[/bold][/red]"

        # --- Apply filters ---
        if status_filter:
            if status_filter.lower() == "passed" and calculated_status.startswith("[red"):
                continue
            elif status_filter.lower() == "failed" and calculated_status.startswith("[green"):
                continue

        if average_filter:
            try:
                op, duration_str = average_filter.split(":")
                duration_seconds = parse_duration(duration_str)
                if op == "gt" and not avg_duration > duration_seconds:
                    continue
                if op == "lt" and not avg_duration < duration_seconds:
                    continue
                if op == "eq" and not avg_duration == duration_seconds:
                    continue
                if op == "gte" and not avg_duration >= duration_seconds:
                    continue
                if op == "lte" and not avg_duration <= duration_seconds:
                    continue

            except (ValueError, KeyError) as e:
                return f"Invalid average filter format: {average_filter}.  Use 'op:duration' (e.g., gt:2h30m, lte:1h)."


        if total_filter:
            try:
                op, duration_str = total_filter.split(":")
                duration_seconds = parse_duration(duration_str)

                if op == "gt" and not total_duration > duration_seconds:
                    continue
                if op == "lt" and not total_duration < duration_seconds:
                    continue
                if op == "eq" and not total_duration == duration_seconds:
                    continue
                if op == "gte" and not total_duration >= duration_seconds:
                    continue
                if op == "lte" and not total_duration <= duration_seconds:
                    continue
            except (ValueError,KeyError) as e:
                return f"Invalid total filter format: {total_filter}. Use 'op:duration' (e.g., gt:8h, eq:4h30m)."
        # --- End filter application ---

        summary_data.append({"date": date_str, "average": avg_duration, "total": total_duration, "status": calculated_status})


    # Sort based on the requested criteria.
    if sort_by == "date":
        summary_data.sort(key=lambda x: x["date"])
    elif sort_by == "date-desc":
        summary_data.sort(key=lambda x: x["date"], reverse=True)
    elif sort_by == "average":
        summary_data.sort(key=lambda x: x["average"])
    elif sort_by == "average-desc":
        summary_data.sort(key=lambda x: x["average"], reverse=True)
    elif sort_by == "total":
        summary_data.sort(key=lambda x: x["total"])
    elif sort_by == "total-desc":
        summary_data.sort(key=lambda x: x["total"], reverse=True)
    elif sort_by == "status":
        summary_data.sort(key=lambda x: x["status"])
    elif sort_by == "status-desc":
        summary_data.sort(key=lambda x: x["status"], reverse=True)
    else:  # Default sort (date-desc)
        summary_data.sort(key=lambda x: x["date"], reverse=True)

    # Display the summary.
    console = Console()
    table = Table(show_header=True, header_style="#fcba03")
    table.add_column("S.No", style="dim", justify="center", width=5)
    table.add_column("Date", justify="center", width=12)
    table.add_column("Average", justify="center", width=10)
    table.add_column("Total", justify="center", width=10)
    table.add_column("Status", justify="center", width=10)

    for i, data in enumerate(summary_data, start=1):
        table.add_row(str(i), data["date"], format_duration(data["average"]), format_duration(data["total"]), data["status"])

    console.print(table)
    return None