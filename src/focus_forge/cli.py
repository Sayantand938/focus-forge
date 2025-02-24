# src/focus_forge/cli.py
import typer
from .add_session import add_start_session, add_stop_session, add_manual_session, format_duration
from .list_sessions import display_sessions
from .db_utils import delete_session, edit_session, update_id_mapping, get_db_id, fetch_all_data
from .summary_sessions import calculate_summary
from enum import Enum
from typing import Optional, Tuple
from datetime import datetime, date, timedelta, time
import logging
import re


logger = logging.getLogger(__name__)

app = typer.Typer()

class SortOption(str, Enum):
    date = "date"
    date_desc = "date-desc"
    start_time = "start-time"
    start_time_desc = "start-time-desc"
    duration = "duration"
    duration_desc = "duration-desc"

class SummarySortOption(str, Enum):
    date = "date"
    date_desc = "date-desc"
    average = "average"
    average_desc = "average-desc"
    total = "total"
    total_desc = "total-desc"
    status = "status"
    status_desc = "status-desc"

@app.command()
def start():
    """Start a new focus session."""
    success, message = add_start_session()
    if success:
        typer.echo(message)
    else:
        typer.echo(message)

@app.command()
def stop():
    """Stop the current focus session."""
    success, duration, message = add_stop_session()
    if success:
        typer.echo(message)
    else:
        typer.echo(message)


def parse_date_argument(arg_value: Optional[str], arg_name: str) -> Tuple[Optional[str], Optional[str]]:
    """Parses a date argument and returns the format and the parsed value.
       Handles relative dates.
    """
    if not arg_value:
        return None, None

    relative_dates = {
        "today": lambda: date.today().strftime("%Y-%m-%d"),
        "yesterday": lambda: (date.today() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "tomorrow": lambda: (date.today() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "this_week": lambda: date.today() - timedelta(days=date.today().weekday()),  # Monday start
        "last_week": lambda: date.today() - timedelta(days=date.today().weekday() + 7),
        "this_month": lambda: date.today().strftime("%Y-%m"),
        "last_month": lambda: (date.today().replace(day=1) - timedelta(days=1)).strftime("%Y-%m"),
        "this_year": lambda: date.today().strftime("%Y"),
        "last_year": lambda: (date.today().replace(month=1, day=1) - timedelta(days=1)).strftime("%Y"),
    }

    if arg_value in relative_dates:
        relative_date_val = relative_dates[arg_value]()
        if arg_value in ("this_week", "last_week"):
             return "%Y-%m-%d", relative_date_val.strftime("%Y-%m-%d")
        return "%Y-%m-%d" if arg_value not in ("this_month", "last_month", "this_year", "last_year") else  None , relative_date_val

    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            datetime.strptime(arg_value, fmt)
            return fmt, arg_value
        except ValueError:
            continue

    typer.echo(f"Error: Invalid {arg_name} format. Use YYYY-MM-DD, YYYY-MM, YYYY, or a valid relative date keyword.")
    raise typer.Exit(code=1)  # Corrected line

@app.command()
def list(sort: SortOption = typer.Option(SortOption.date, "--sort", help="Sort the output."),
         date: Optional[str] = typer.Option(None, "--date", "-d", help="Filter by date (YYYY-MM-DD, relative date)."),
         since: Optional[str] = typer.Option(None, "--since", "-S", help="Show sessions since this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
         until: Optional[str] = typer.Option(None, "--until", "-U", help="Show sessions until this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
         month: Optional[str] = typer.Option(None, "--month", "-m", help="Show sessions for a specific month (YYYY-MM).")
        ):
    """List all focus sessions."""

    since_format, since_value = parse_date_argument(since, "--since")
    until_format, until_value = parse_date_argument(until, "--until")
    month_format, month_value = parse_date_argument(month, "--month")
    date_format, date_value = parse_date_argument(date, "--date")

    if month_value:
        if since_value or until_value or date_value:
            typer.echo("Error: Cannot use --month with --since, --until or --date.")
            raise typer.Exit(code=1)  # Corrected line
        if month_format != "%Y-%m" and month_format != None :
            typer.echo("Error: Invalid --month format. Use YYYY-MM.")
            raise typer.Exit(code=1) # Corrected line


    elif since_format and until_format and since_format != until_format:
        typer.echo("Error: Cannot mix date, month, and year formats for --since and --until.")
        raise typer.Exit(code=1)  # Corrected line
    elif since_value and until_value:
         # We need to compare using datetime objects after resolving relative dates
        since_datetime = datetime.strptime(since_value, since_format) if since_format else datetime.strptime(since_value + "-01-01" if len(since_value) == 4 else since_value + "-01", "%Y-%m")
        until_datetime = datetime.strptime(until_value, until_format) if until_format else datetime.strptime(until_value + "-12-31" if len(until_value) == 4 else until_value + f"-{ (datetime.strptime(until_value + '-1', '%Y-%m') + timedelta(days=31)).strftime('%d')}", "%Y-%m-%d" )

        if since_datetime > until_datetime:
            typer.echo("Error: --since cannot be after --until.")
            raise typer.Exit(code=1)  # Corrected line

    # Update id_mapping *before* fetching data.
    update_id_mapping(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value)
    result = display_sessions(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value)
    if result:
        typer.echo(result)


@app.command()
def add(time_range: str):
    """Add a focus session manually.  Format: "08:00 AM - 10:00 AM"."""
    success, message = add_manual_session(time_range)
    if success:
        typer.echo(message)
    else:
        typer.echo(message)

@app.command()
def delete(serial_number: int):
    """Delete a focus session by its serial number."""
    try:
        db_id = get_db_id(serial_number)  # Get the database ID from serial number
        success, message = delete_session(db_id) # Pass db_id
        if success:
            typer.echo(message)
        else:
            typer.echo(message)
    except ValueError as e:
        typer.echo(str(e))  # Display error from get_db_id
    except Exception as e:
        logger.error(f"An error occurred while deleting: {e}")
        typer.echo("An unexpected error occurred.")

@app.command()
def edit(
    serial_number: int,
    date: Optional[str] = typer.Option(None, "--date", "-d", help="New date for the session (YYYY-MM-DD)."),
    start_time: Optional[str] = typer.Option(None, "--start-time", "-s", help="New start time (HH:MM:SS)."),
    end_time: Optional[str] = typer.Option(None, "--end-time", "-e", help="New end time (HH:MM:SS)."),
):
    """Edit an existing focus session."""
    try:
        db_id = get_db_id(serial_number)  # Get the database ID
        date_format, date_value = parse_date_argument(date, "date") if date else (None, None)

        # Strict time format validation (HH:MM:SS)
        if start_time:
            if not re.match(r"^\d{2}:\d{2}:\d{2}$", start_time):
                typer.echo("Invalid start time format. Use HH:MM:SS (e.g., 08:30:00).")
                raise typer.Exit(code=1)  # Corrected line
            try:  # Still check for valid *time* values
                datetime.strptime(start_time, "%H:%M:%S")
            except ValueError:
                typer.echo("Invalid start time.  Ensure hours (00-23), minutes (00-59), and seconds (00-59) are valid.")
                raise typer.Exit(code=1)  # Corrected line
        if end_time:
            if not re.match(r"^\d{2}:\d{2}:\d{2}$", end_time):
                typer.echo("Invalid end time format. Use HH:MM:SS (e.g., 17:00:00).")
                raise typer.Exit(code=1)  # Corrected line
            try:
                datetime.strptime(end_time, "%H:%M:%S")
            except ValueError:
                typer.echo("Invalid end time. Ensure hours (00-23), minutes (00-59), and seconds (00-59) are valid.")
                raise typer.Exit(code=1) # Corrected line

        success, message = edit_session(db_id, date_value, start_time, end_time)  # Pass db_id
        if success:
            typer.echo(message)
        else:
            typer.echo(message)

    except ValueError as e:
        typer.echo(str(e)) # Show errors from get_db_id
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        typer.echo("An unexpected error occurred.")

@app.command()
def summary(sort: SummarySortOption = typer.Option(SummarySortOption.date_desc, "--sort", help="Sort the output."),
         date: Optional[str] = typer.Option(None, "--date", "-d", help="Filter by date (YYYY-MM-DD, relative date)."),
         since: Optional[str] = typer.Option(None, "--since", "-S", help="Show sessions since this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
         until: Optional[str] = typer.Option(None, "--until", "-U", help="Show sessions until this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
         month: Optional[str] = typer.Option(None, "--month", "-m", help="Show sessions for a specific month (YYYY-MM)."),
         status: Optional[str] = typer.Option(None, "--status", help="Filter by status (passed/failed)."),
         average: Optional[str] = typer.Option(None, "--average", help="Filter average duration. Format: 'op:duration', e.g., 'gt:2h30m'"),  # New filter
         total: Optional[str] = typer.Option(None, "--total", help="Filter total duration. Format: 'op:duration', e.g., 'gte:8h'"), # New filter
        ):
    """Display a summary of focus sessions."""
    since_format, since_value = parse_date_argument(since, "--since")
    until_format, until_value = parse_date_argument(until, "--until")
    month_format, month_value = parse_date_argument(month, "--month")
    date_format, date_value = parse_date_argument(date, "--date")

    if month_value:
        if since_value or until_value or date_value:
            typer.echo("Error: Cannot use --month with --since, --until or --date.")
            raise typer.Exit(code=1)  # Corrected line
        if month_format != "%Y-%m" and month_format != None :
            typer.echo("Error: Invalid --month format. Use YYYY-MM.")
            raise typer.Exit(code=1) # Corrected line

    elif since_format and until_format and since_format != until_format:
        typer.echo("Error: Cannot mix date, month, and year formats for --since and --until.")
        raise typer.Exit(code=1) # Corrected line

    elif since_value and until_value:
        since_datetime = datetime.strptime(since_value, since_format) if since_format else datetime.strptime(since_value + "-01-01" if len(since_value) == 4 else since_value + "-01", "%Y-%m")
        until_datetime = datetime.strptime(until_value, until_format) if until_format else datetime.strptime(until_value + "-12-31" if len(until_value) == 4 else until_value + f"-{ (datetime.strptime(until_value + '-1', '%Y-%m') + timedelta(days=31)).strftime('%d')}", "%Y-%m-%d" )
        if since_datetime > until_datetime:
            typer.echo("Error: --since cannot be after --until.")
            raise typer.Exit(code=1)  # Corrected line

    if status and status.lower() not in ("passed", "failed"):
        typer.echo("Error: --status must be either 'passed' or 'failed'.")
        raise typer.Exit(code=1)  # Corrected line

    result = calculate_summary(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value, status_filter=status, average_filter=average, total_filter=total)

    if result:
        typer.echo(result)

if __name__ == "__main__":
    app()