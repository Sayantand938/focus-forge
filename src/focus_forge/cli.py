# src/focus_forge/cli.py
import typer
from .add_session import add_start_session, add_stop_session, add_manual_session, format_duration
from .list_sessions import display_sessions
from .db_utils import delete_session, edit_session, update_id_mapping, get_db_id, fetch_all_data
from .summary_sessions import calculate_summary
from enum import Enum
from typing import Optional, Tuple
from datetime import datetime, date, timedelta, time
import re

app = typer.Typer()

class SortOption(str, Enum):
    """Enum for defining available sorting options for the list command."""
    date = "date"
    date_desc = "date-desc"
    start_time = "start-time"
    start_time_desc = "start-time-desc"
    duration = "duration"
    duration_desc = "duration-desc"

class SummarySortOption(str, Enum):
    """Enum for defining available sorting options for the summary command."""
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
    """Start a new focus session.  This command begins tracking a new session in the database."""
    success, message = add_start_session()
    typer.echo(message)  # Output the result message (success or error).


@app.command()
def stop():
    """Stop the currently running focus session. This command ends the active session and calculates its duration."""
    success, duration, message = add_stop_session()
    typer.echo(message) # Output the result message.


def parse_date_argument(arg_value: Optional[str], arg_name: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Parses a date argument, handling various formats and relative date keywords.

    Args:
        arg_value: The string value of the date argument.
        arg_name: The name of the argument (for error messages).

    Returns:
        A tuple: (date format string, parsed date string).
        Returns (None, None) if arg_value is None.
        Exits with an error message if the date format is invalid.
    """
    if not arg_value:
        return None, None

    # Define relative date keywords and their corresponding lambda functions to calculate the date.
    relative_dates = {
        "today": lambda: date.today().strftime("%Y-%m-%d"),
        "yesterday": lambda: (date.today() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "tomorrow": lambda: (date.today() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "this_week": lambda: date.today() - timedelta(days=date.today().weekday()),  # Monday start of the week
        "last_week": lambda: date.today() - timedelta(days=date.today().weekday() + 7), # Monday start of last week
        "this_month": lambda: date.today().strftime("%Y-%m"),
        "last_month": lambda: (date.today().replace(day=1) - timedelta(days=1)).strftime("%Y-%m"),
        "this_year": lambda: date.today().strftime("%Y"),
        "last_year": lambda: (date.today().replace(month=1, day=1) - timedelta(days=1)).strftime("%Y"),
    }

    # Check if the argument value is a relative date keyword.
    if arg_value in relative_dates:
        relative_date_val = relative_dates[arg_value]()
        if arg_value in ("this_week", "last_week"):  # Special handling for week start dates
             return "%Y-%m-%d", relative_date_val.strftime("%Y-%m-%d")
        return "%Y-%m-%d" if arg_value not in ("this_month", "last_month", "this_year", "last_year") else  None , relative_date_val

    # Try parsing the date string with different formats.
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            datetime.strptime(arg_value, fmt)
            return fmt, arg_value  # Return the format and the value if successful.
        except ValueError:
            continue  # Try the next format if parsing fails.

    # If no format matches, print an error message and exit.
    typer.echo(f"Error: Invalid {arg_name} format. Use YYYY-MM-DD, YYYY-MM, YYYY, or a valid relative date keyword.")
    raise typer.Exit(code=1)

@app.command()
def list(sort: SortOption = typer.Option(SortOption.date, "--sort", help="Sort the output."),
         date: Optional[str] = typer.Option(None, "--date", "-d", help="Filter by date (YYYY-MM-DD, relative date)."),
         since: Optional[str] = typer.Option(None, "--since", "-S", help="Show sessions since this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
         until: Optional[str] = typer.Option(None, "--until", "-U", help="Show sessions until this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
         month: Optional[str] = typer.Option(None, "--month", "-m", help="Show sessions for a specific month (YYYY-MM).")
        ):
    """
    List all focus sessions.  Supports sorting and filtering by date, date range, and month.

    The list command retrieves and displays focus session data from the database.  It provides options for sorting the
    results and filtering the data based on various date criteria. The output is displayed in a table format.

    Args:
        sort: The field to sort by (date, start-time, duration).  Defaults to date (ascending). Use '-desc' suffix for descending order.
        date:  Filter sessions to a specific date (YYYY-MM-DD format or relative date keyword).
        since: Show sessions starting from a specific date, month, or year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date).
        until: Show sessions ending by a specific date, month, or year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date).
        month: Show sessions for a specific month (YYYY-MM format).
    """

    # Parse date arguments using the helper function.
    since_format, since_value = parse_date_argument(since, "--since")
    until_format, until_value = parse_date_argument(until, "--until")
    month_format, month_value = parse_date_argument(month, "--month")
    date_format, date_value = parse_date_argument(date, "--date")

    # Validate that --month is not used with other date filters.
    if month_value:
        if since_value or until_value or date_value:
            typer.echo("Error: Cannot use --month with --since, --until or --date.")
            raise typer.Exit(code=1)
        if month_format != "%Y-%m" and month_format != None :
            typer.echo("Error: Invalid --month format. Use YYYY-MM.")
            raise typer.Exit(code=1)


    # Validate that --since and --until use the same date format (if both are provided).
    elif since_format and until_format and since_format != until_format:
        typer.echo("Error: Cannot mix date, month, and year formats for --since and --until.")
        raise typer.Exit(code=1)
    # Validate that --since is not after --until.
    elif since_value and until_value:
         # We need to compare using datetime objects after resolving relative dates
        since_datetime = datetime.strptime(since_value, since_format) if since_format else datetime.strptime(since_value + "-01-01" if len(since_value) == 4 else since_value + "-01", "%Y-%m")
        until_datetime = datetime.strptime(until_value, until_format) if until_format else datetime.strptime(until_value + "-12-31" if len(until_value) == 4 else until_value + f"-{ (datetime.strptime(until_value + '-1', '%Y-%m') + timedelta(days=31)).strftime('%d')}", "%Y-%m-%d" )

        if since_datetime > until_datetime:
            typer.echo("Error: --since cannot be after --until.")
            raise typer.Exit(code=1)

    # Update the ID mapping before fetching data.  This ensures the serial numbers are correct.
    update_id_mapping(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value)
    result = display_sessions(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value)
    if result:
        typer.echo(result)  # Output the table of sessions, or a message if no sessions are found.


@app.command()
def add(time_range: str):
    """
    Add a focus session manually.

    Args:
        time_range: A string representing the start and end time, separated by " - ".
                     Example: "08:00 AM - 10:00 AM" (12-hour format) or "14:00:00 - 17:45:00" (24-hour format).
    """
    success, message = add_manual_session(time_range)
    typer.echo(message) # Output the result (success or error).

@app.command()
def delete(serial_number: int):
    """
    Delete a focus session by its serial number.

    Args:
        serial_number: The serial number of the session to delete (as displayed in the 'list' command).
    """
    try:
        db_id = get_db_id(serial_number)  # Get the database ID from the serial number.
        success, message = delete_session(db_id) # Delete the session using the database ID.
        typer.echo(message) # Output the result.
    except ValueError as e:
        typer.echo(str(e))  # Display error from get_db_id (e.g., invalid serial number).
    except Exception as e:
        # logger.error(f"An error occurred while deleting: {e}") # Removed logger
        typer.echo("An unexpected error occurred.")

@app.command()
def edit(
    serial_number: int,
    date: Optional[str] = typer.Option(None, "--date", "-d", help="New date for the session (YYYY-MM-DD)."),
    start_time: Optional[str] = typer.Option(None, "--start-time", "-s", help="New start time (HH:MM:SS)."),
    end_time: Optional[str] = typer.Option(None, "--end-time", "-e", help="New end time (HH:MM:SS)."),
):
    """
    Edit an existing focus session. Allows modification of date, start time, and end time.

    Args:
        serial_number: The serial number of the session to edit (as displayed in the 'list' command).
        date: The new date for the session (YYYY-MM-DD format).
        start_time: The new start time for the session (HH:MM:SS format).
        end_time: The new end time for the session (HH:MM:SS format).
    """
    try:
        db_id = get_db_id(serial_number)  # Get the database ID from the serial number.
        date_format, date_value = parse_date_argument(date, "date") if date else (None, None)

        # Strict time format validation (HH:MM:SS) using regular expressions.
        if start_time:
            if not re.match(r"^\d{2}:\d{2}:\d{2}$", start_time):
                typer.echo("Invalid start time format. Use HH:MM:SS (e.g., 08:30:00).")
                raise typer.Exit(code=1)
            try:  # Also check for valid *time* values (hours, minutes, seconds).
                datetime.strptime(start_time, "%H:%M:%S")
            except ValueError:
                typer.echo("Invalid start time.  Ensure hours (00-23), minutes (00-59), and seconds (00-59) are valid.")
                raise typer.Exit(code=1)
        if end_time:
            if not re.match(r"^\d{2}:\d{2}:\d{2}$", end_time):
                typer.echo("Invalid end time format. Use HH:MM:SS (e.g., 17:00:00).")
                raise typer.Exit(code=1)
            try:
                datetime.strptime(end_time, "%H:%M:%S")
            except ValueError:
                typer.echo("Invalid end time. Ensure hours (00-23), minutes (00-59), and seconds (00-59) are valid.")
                raise typer.Exit(code=1)

        success, message = edit_session(db_id, date_value, start_time, end_time)  # Edit the session.
        typer.echo(message) # Output the result.

    except ValueError as e:
        typer.echo(str(e)) # Show errors from get_db_id (e.g., invalid serial number).
    except Exception as e:
        # logger.error(f"An error occurred: {e}") # Removed logger
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
    """
    Display a summary of focus sessions.  Provides aggregated data, including average and total durations,
    and a status (passed/failed) based on a daily target of 8 hours.  Supports filtering and sorting.

    Args:
        sort:  The field to sort the summary by (date, average, total, status).  Defaults to date (descending).
               Use '-desc' suffix for descending order.
        date:  Filter sessions to a specific date (YYYY-MM-DD format or relative date keyword).
        since: Show sessions starting from a specific date, month, or year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date).
        until: Show sessions ending by a specific date, month, or year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date).
        month: Show sessions for a specific month (YYYY-MM format).
        status: Filter the summary to show only "passed" or "failed" days.
        average: Filter by average duration. Use 'op:duration' format (e.g., 'gt:2h30m').
        total: Filter by total duration. Use 'op:duration' format (e.g., 'gte:8h').
    """
    # Parse date arguments.
    since_format, since_value = parse_date_argument(since, "--since")
    until_format, until_value = parse_date_argument(until, "--until")
    month_format, month_value = parse_date_argument(month, "--month")
    date_format, date_value = parse_date_argument(date, "--date")

    # Validate that --month is not used with other date filters.
    if month_value:
        if since_value or until_value or date_value:
            typer.echo("Error: Cannot use --month with --since, --until or --date.")
            raise typer.Exit(code=1)
        if month_format != "%Y-%m" and month_format != None :
            typer.echo("Error: Invalid --month format. Use YYYY-MM.")
            raise typer.Exit(code=1)

    # Validate that --since and --until use the same format.
    elif since_format and until_format and since_format != until_format:
        typer.echo("Error: Cannot mix date, month, and year formats for --since and --until.")
        raise typer.Exit(code=1)

    # Validate that --since is not after --until.
    elif since_value and until_value:
        since_datetime = datetime.strptime(since_value, since_format) if since_format else datetime.strptime(since_value + "-01-01" if len(since_value) == 4 else since_value + "-01", "%Y-%m")
        until_datetime = datetime.strptime(until_value, until_format) if until_format else datetime.strptime(until_value + "-12-31" if len(until_value) == 4 else until_value + f"-{ (datetime.strptime(until_value + '-1', '%Y-%m') + timedelta(days=31)).strftime('%d')}", "%Y-%m-%d" )
        if since_datetime > until_datetime:
            typer.echo("Error: --since cannot be after --until.")
            raise typer.Exit(code=1)

    # Validate the --status filter.
    if status and status.lower() not in ("passed", "failed"):
        typer.echo("Error: --status must be either 'passed' or 'failed'.")
        raise typer.Exit(code=1)

    # Calculate the summary, applying filters and sorting.
    result = calculate_summary(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value, status_filter=status, average_filter=average, total_filter=total)

    if result:
        typer.echo(result) # Output the summary table, or a message if no sessions are found.

if __name__ == "__main__":
    app()