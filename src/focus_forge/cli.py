# # src/focus_forge/cli.py
# import typer
# from .session_manager import add_start_session, add_stop_session, add_manual_session, format_duration
# from .session_details import display_sessions
# from .db_utils import delete_session, edit_session, update_id_mapping, get_db_id, fetch_all_data
# from .session_summary import calculate_summary
# from .leaderboard_manager import display_leaderboard  # Corrected import
# from enum import Enum
# from typing import Optional, Tuple
# from datetime import datetime, date, timedelta, time
# import re
# import random


# app = typer.Typer()

# class SortOption(str, Enum):
#     """Enum for defining available sorting options for the 'list' command."""
#     date = "date"
#     date_desc = "date-desc"
#     start_time = "start-time"
#     start_time_desc = "start-time-desc"
#     duration = "duration"
#     duration_desc = "duration-desc"

# class SummarySortOption(str, Enum):
#     """Enum for defining available sorting options for the 'summary' command."""
#     date = "date"
#     date_desc = "date-desc"
#     average = "average"
#     average_desc = "average-desc"
#     total = "total"
#     total_desc = "total-desc"
#     status = "status"
#     status_desc = "status-desc"

# @app.command()
# def start():
#     # Starts a new focus session.
#     success, message = add_start_session()
#     typer.echo(message)  # Output the result.


# @app.command()
# def stop():
#     # Stops the current focus session.
#     success, duration, message = add_stop_session()
#     typer.echo(message) # Output the result.


# def parse_date_argument(arg_value: Optional[str], arg_name: str) -> Tuple[Optional[str], Optional[str]]:
#     """Parses a date argument, handling different formats and relative dates."""
#     if not arg_value:
#         return None, None

#     # Relative date keywords and functions to calculate the date.
#     relative_dates = {
#         "today": lambda: date.today().strftime("%Y-%m-%d"),
#         "yesterday": lambda: (date.today() - timedelta(days=1)).strftime("%Y-%m-%d"),
#         "tomorrow": lambda: (date.today() + timedelta(days=1)).strftime("%Y-%m-%d"),
#         "this_week": lambda: date.today() - timedelta(days=date.today().weekday()),  # Monday start
#         "last_week": lambda: date.today() - timedelta(days=date.today().weekday() + 7), # Monday start
#         "this_month": lambda: date.today().strftime("%Y-%m"),
#         "last_month": lambda: (date.today().replace(day=1) - timedelta(days=1)).strftime("%Y-%m"),
#         "this_year": lambda: date.today().strftime("%Y"),
#         "last_year": lambda: (date.today().replace(month=1, day=1) - timedelta(days=1)).strftime("%Y"),
#     }

#     # Check for relative date keywords.
#     if arg_value in relative_dates:
#         relative_date_val = relative_dates[arg_value]()
#         if arg_value in ("this_week", "last_week"):  # Special handling for week start
#              return "%Y-%m-%d", relative_date_val.strftime("%Y-%m-%d")
#         return "%Y-%m-%d" if arg_value not in ("this_month", "last_month", "this_year", "last_year") else  None , relative_date_val

#     # Try parsing with different formats.
#     for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
#         try:
#             datetime.strptime(arg_value, fmt)
#             return fmt, arg_value  # Return format and value.
#         except ValueError:
#             continue

#     # Error for invalid format.
#     typer.echo(f"Error: Invalid {arg_name} format. Use YYYY-MM-DD, YYYY-MM, YYYY, or a valid relative date keyword.")
#     raise typer.Exit(code=1)

# @app.command()
# def list(sort: SortOption = typer.Option(SortOption.date, "--sort", help="Sort the output."),
#          date: Optional[str] = typer.Option(None, "--date", "-d", help="Filter by date (YYYY-MM-DD, relative date)."),
#          since: Optional[str] = typer.Option(None, "--since", "-S", help="Show sessions since this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
#          until: Optional[str] = typer.Option(None, "--until", "-U", help="Show sessions until this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
#          month: Optional[str] = typer.Option(None, "--month", "-m", help="Show sessions for a specific month (YYYY-MM).")
#         ):
#     """Lists focus sessions with sorting and filtering options."""

#     # Parse date arguments.
#     since_format, since_value = parse_date_argument(since, "--since")
#     until_format, until_value = parse_date_argument(until, "--until")
#     month_format, month_value = parse_date_argument(month, "--month")
#     date_format, date_value = parse_date_argument(date, "--date")

#     # Validate --month usage.
#     if month_value:
#         if since_value or until_value or date_value:
#             typer.echo("Error: Cannot use --month with --since, --until or --date.")
#             raise typer.Exit(code=1)
#         if month_format != "%Y-%m" and month_format != None:
#             typer.echo("Error: Invalid --month format. Use YYYY-MM.")
#             raise typer.Exit(code=1)


#     # Validate --since and --until formats.
#     elif since_format and until_format and since_format != until_format:
#         typer.echo("Error: Cannot mix date, month, and year formats for --since and --until.")
#         raise typer.Exit(code=1)
#     # Validate --since and --until values
#     elif since_value and until_value:
#         # Compare using datetime objects
#         since_datetime = datetime.strptime(since_value, since_format) if since_format else datetime.strptime(since_value + "-01-01" if len(since_value) == 4 else since_value + "-01", "%Y-%m")
#         until_datetime = datetime.strptime(until_value, until_format) if until_format else datetime.strptime(until_value + "-12-31" if len(until_value) == 4 else until_value + f"-{ (datetime.strptime(until_value + '-1', '%Y-%m') + timedelta(days=31)).strftime('%d')}", "%Y-%m-%d" )

#         if since_datetime > until_datetime:
#             typer.echo("Error: --since cannot be after --until.")
#             raise typer.Exit(code=1)

#     # Update ID mapping.
#     update_id_mapping(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value)
#     result = display_sessions(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value)
#     if result:
#         typer.echo(result)  # Output table or message.


# @app.command()
# def add(time_range: str):
#     # Adds a focus session manually.
#     success, message = add_manual_session(time_range)
#     typer.echo(message) # Output the result.

# @app.command()
# def delete(serial_number: int):
#     # Deletes a focus session by serial number.
#     try:
#         db_id = get_db_id(serial_number)  # Get database ID.
#         success, message = delete_session(db_id) # Delete.
#         typer.echo(message) # Output result.
#     except ValueError as e:
#         typer.echo(str(e))  # Error from get_db_id.
#     except Exception as e:
#         # logger.error(f"An error occurred while deleting: {e}") # Removed Logger
#         typer.echo("An unexpected error occurred.")

# @app.command()
# def edit(
#     serial_number: int,
#     date: Optional[str] = typer.Option(None, "--date", "-d", help="New date (YYYY-MM-DD)."),
#     start_time: Optional[str] = typer.Option(None, "--start-time", "-s", help="New start time (HH:MM:SS)."),
#     end_time: Optional[str] = typer.Option(None, "--end-time", "-e", help="New end time (HH:MM:SS)."),
# ):
#     # Edits an existing focus session.
#     try:
#         db_id = get_db_id(serial_number)  # Get database ID.
#         date_format, date_value = parse_date_argument(date, "date") if date else (None, None)

#         # Validate time format (HH:MM:SS).
#         if start_time:
#             if not re.match(r"^\d{2}:\d{2}:\d{2}$", start_time):
#                 typer.echo("Invalid start time format. Use HH:MM:SS (e.g., 08:30:00).")
#                 raise typer.Exit(code=1)
#             try:  # Check for valid time values.
#                 datetime.strptime(start_time, "%H:%M:%S")
#             except ValueError:
#                 typer.echo("Invalid start time.  Ensure hours (00-23), minutes (00-59), and seconds (00-59) are valid.")
#                 raise typer.Exit(code=1)
#         if end_time:
#             if not re.match(r"^\d{2}:\d{2}:\d{2}$", end_time):
#                 typer.echo("Invalid end time format. Use HH:MM:SS (e.g., 17:00:00).")
#                 raise typer.Exit(code=1)
#             try:
#                 datetime.strptime(end_time, "%H:%M:%S")
#             except ValueError:
#                 typer.echo("Invalid end time. Ensure hours (00-23), minutes (00-59), and seconds (00-59) are valid.")
#                 raise typer.Exit(code=1)

#         success, message = edit_session(db_id, date_value, start_time, end_time)  # Edit session.
#         typer.echo(message) # Output result.

#     except ValueError as e:
#         typer.echo(str(e)) # Error from get_db_id.
#     except Exception as e:
#         # logger.error(f"An error occurred: {e}") # Removed logger
#         typer.echo("An unexpected error occurred.")

# @app.command()
# def summary(sort: SummarySortOption = typer.Option(SummarySortOption.date_desc, "--sort", help="Sort the output."),
#          date: Optional[str] = typer.Option(None, "--date", "-d", help="Filter by date (YYYY-MM-DD, relative date)."),
#          since: Optional[str] = typer.Option(None, "--since", "-S", help="Show sessions since this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
#          until: Optional[str] = typer.Option(None, "--until", "-U", help="Show sessions until this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
#          month: Optional[str] = typer.Option(None, "--month", "-m", help="Show sessions for a specific month (YYYY-MM)."),
#          status: Optional[str] = typer.Option(None, "--status", help="Filter by status (passed/failed)."),
#          average: Optional[str] = typer.Option(None, "--average", help="Filter average duration. Format: 'op:duration', e.g., 'gt:2h30m'"),  # New filter
#          total: Optional[str] = typer.Option(None, "--total", help="Filter total duration. Format: 'op:duration', e.g., 'gte:8h'"), # New filter
#         ):
#     """Displays a summary of focus sessions with filtering and sorting."""

#     # Parse date arguments.
#     since_format, since_value = parse_date_argument(since, "--since")
#     until_format, until_value = parse_date_argument(until, "--until")
#     month_format, month_value = parse_date_argument(month, "--month")
#     date_format, date_value = parse_date_argument(date, "--date")

#     # Validate --month.
#     if month_value:
#         if since_value or until_value or date_value:
#             typer.echo("Error: Cannot use --month with --since, --until or --date.")
#             raise typer.Exit(code=1)
#         if month_format != "%Y-%m" and month_format != None:
#             typer.echo("Error: Invalid --month format. Use YYYY-MM.")
#             raise typer.Exit(code=1)

#     # Validate --since and --until formats.
#     elif since_format and until_format and since_format != until_format:
#         typer.echo("Error: Cannot mix date, month, and year formats for --since and --until.")
#         raise typer.Exit(code=1)

#     # Validate that --since is not after --until.
#     elif since_value and until_value:
#         since_datetime = datetime.strptime(since_value, since_format) if since_format else datetime.strptime(since_value + "-01-01" if len(since_value) == 4 else since_value + "-01", "%Y-%m")
#         until_datetime = datetime.strptime(until_value, until_format) if until_format else datetime.strptime(until_value + "-12-31" if len(until_value) == 4 else until_value + f"-{ (datetime.strptime(until_value + '-1', '%Y-%m') + timedelta(days=31)).strftime('%d')}", "%Y-%m-%d" )
#         if since_datetime > until_datetime:
#             typer.echo("Error: --since cannot be after --until.")
#             raise typer.Exit(code=1)

#     # Validate --status.
#     if status and status.lower() not in ("passed", "failed"):
#         typer.echo("Error: --status must be either 'passed' or 'failed'.")
#         raise typer.Exit(code=1)

#     # Calculate summary.
#     result = calculate_summary(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value, status_filter=status, average_filter=average, total_filter=total)

#     if result:
#         typer.echo(result) # Output summary or message.

# @app.command()
# def rank():
#     """Displays a leaderboard of focus session durations."""
#     result = display_leaderboard()
#     if result:
#         typer.echo(result)

# if __name__ == "__main__":
#     app()



# src/focus_forge/cli.py
import typer
from .session_manager import add_start_session, add_stop_session, add_manual_session, format_duration
from .session_details import display_sessions
from .db_utils import delete_session, edit_session, update_id_mapping, get_db_id, fetch_all_data
from .session_summary import calculate_summary
from .leaderboard_manager import display_leaderboard
from enum import Enum
from typing import Optional, Tuple
from datetime import datetime, date, timedelta, time
import re
import random
import json
from pathlib import Path
from .config import COMMAND_HISTORY_FILE  # Import the new config


app = typer.Typer()

class SortOption(str, Enum):
    """Enum for defining available sorting options for the 'list' command."""
    date = "date"
    date_desc = "date-desc"
    start_time = "start-time"
    start_time_desc = "start-time-desc"
    duration = "duration"
    duration_desc = "duration-desc"

class SummarySortOption(str, Enum):
    """Enum for defining available sorting options for the 'summary' command."""
    date = "date"
    date_desc = "date-desc"
    average = "average"
    average_desc = "average-desc"
    total = "total"
    total_desc = "total-desc"
    status = "status"
    status_desc = "status-desc"

def _read_last_command() -> Optional[str]:
    """Reads the last command from the history file."""
    try:
        if COMMAND_HISTORY_FILE.exists():
            with open(COMMAND_HISTORY_FILE, 'r') as f:
                data = json.load(f)
                return data.get("last_command")
        return None  # File doesn't exist yet
    except (FileNotFoundError, json.JSONDecodeError):
        return None  # Handle file errors

def _write_last_command(command: str):
    """Writes the last command to the history file."""
    try:
        with open(COMMAND_HISTORY_FILE, 'w') as f:
            json.dump({"last_command": command}, f)
    except IOError:
        typer.echo("Error writing to command history file.", err=True) #inform user.


@app.command()
def start():
    # Starts a new focus session.
    success, message = add_start_session()
    typer.echo(message)  # Output the result.


@app.command()
def stop():
    # Stops the current focus session.
    success, duration, message = add_stop_session()
    typer.echo(message) # Output the result.


def parse_date_argument(arg_value: Optional[str], arg_name: str) -> Tuple[Optional[str], Optional[str]]:
    """Parses a date argument, handling different formats and relative dates."""
    if not arg_value:
        return None, None

    # Relative date keywords and functions to calculate the date.
    relative_dates = {
        "today": lambda: date.today().strftime("%Y-%m-%d"),
        "yesterday": lambda: (date.today() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "tomorrow": lambda: (date.today() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "this_week": lambda: date.today() - timedelta(days=date.today().weekday()),  # Monday start
        "last_week": lambda: date.today() - timedelta(days=date.today().weekday() + 7), # Monday start
        "this_month": lambda: date.today().strftime("%Y-%m"),
        "last_month": lambda: (date.today().replace(day=1) - timedelta(days=1)).strftime("%Y-%m"),
        "this_year": lambda: date.today().strftime("%Y"),
        "last_year": lambda: (date.today().replace(month=1, day=1) - timedelta(days=1)).strftime("%Y"),
    }

    # Check for relative date keywords.
    if arg_value in relative_dates:
        relative_date_val = relative_dates[arg_value]()
        if arg_value in ("this_week", "last_week"):  # Special handling for week start
             return "%Y-%m-%d", relative_date_val.strftime("%Y-%m-%d")
        return "%Y-%m-%d" if arg_value not in ("this_month", "last_month", "this_year", "last_year") else  None , relative_date_val

    # Try parsing with different formats.
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            datetime.strptime(arg_value, fmt)
            return fmt, arg_value  # Return format and value.
        except ValueError:
            continue

    # Error for invalid format.
    typer.echo(f"Error: Invalid {arg_name} format. Use YYYY-MM-DD, YYYY-MM, YYYY, or a valid relative date keyword.")
    raise typer.Exit(code=1)

@app.command()
def list(sort: SortOption = typer.Option(SortOption.date, "--sort", help="Sort the output."),
         date: Optional[str] = typer.Option(None, "--date", "-d", help="Filter by date (YYYY-MM-DD, relative date)."),
         since: Optional[str] = typer.Option(None, "--since", "-S", help="Show sessions since this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
         until: Optional[str] = typer.Option(None, "--until", "-U", help="Show sessions until this date/month/year (YYYY-MM-DD, YYYY-MM, YYYY, or relative date)."),
         month: Optional[str] = typer.Option(None, "--month", "-m", help="Show sessions for a specific month (YYYY-MM).")
        ):
    """Lists focus sessions with sorting and filtering options."""

    # Parse date arguments.
    since_format, since_value = parse_date_argument(since, "--since")
    until_format, until_value = parse_date_argument(until, "--until")
    month_format, month_value = parse_date_argument(month, "--month")
    date_format, date_value = parse_date_argument(date, "--date")

    # Validate --month usage.
    if month_value:
        if since_value or until_value or date_value:
            typer.echo("Error: Cannot use --month with --since, --until or --date.")
            raise typer.Exit(code=1)
        if month_format != "%Y-%m" and month_format != None:
            typer.echo("Error: Invalid --month format. Use YYYY-MM.")
            raise typer.Exit(code=1)


    # Validate --since and --until formats.
    elif since_format and until_format and since_format != until_format:
        typer.echo("Error: Cannot mix date, month, and year formats for --since and --until.")
        raise typer.Exit(code=1)
    # Validate --since and --until values
    elif since_value and until_value:
        # Compare using datetime objects
        since_datetime = datetime.strptime(since_value, since_format) if since_format else datetime.strptime(since_value + "-01-01" if len(since_value) == 4 else since_value + "-01", "%Y-%m")
        until_datetime = datetime.strptime(until_value, until_format) if until_format else datetime.strptime(until_value + "-12-31" if len(until_value) == 4 else until_value + f"-{ (datetime.strptime(until_value + '-1', '%Y-%m') + timedelta(days=31)).strftime('%d')}", "%Y-%m-%d" )

        if since_datetime > until_datetime:
            typer.echo("Error: --since cannot be after --until.")
            raise typer.Exit(code=1)

    # Update ID mapping.
    update_id_mapping(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value)
    result = display_sessions(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value)
    if result:
        typer.echo(result)  # Output table or message.

    _write_last_command("list") # Update the last command.


@app.command()
def add(time_range: str):
    # Adds a focus session manually.
    success, message = add_manual_session(time_range)
    typer.echo(message) # Output the result.

@app.command()
def delete(serial_number: int):
    # Deletes a focus session by serial number.

    last_command = _read_last_command()
    if last_command != "list":
        typer.echo("You must run the 'list' command before deleting.")
        raise typer.Exit(code=1)

    try:
        db_id = get_db_id(serial_number)  # Get database ID.
        success, message = delete_session(db_id) # Delete.
        typer.echo(message) # Output result.
        if success: #only if delete is successful
          _write_last_command("delete")
    except ValueError as e:
        typer.echo(str(e))  # Error from get_db_id.
    except Exception as e:
        # logger.error(f"An error occurred while deleting: {e}") # Removed Logger
        typer.echo("An unexpected error occurred.")

@app.command()
def edit(
    serial_number: int,
    date: Optional[str] = typer.Option(None, "--date", "-d", help="New date (YYYY-MM-DD)."),
    start_time: Optional[str] = typer.Option(None, "--start-time", "-s", help="New start time (HH:MM:SS)."),
    end_time: Optional[str] = typer.Option(None, "--end-time", "-e", help="New end time (HH:MM:SS)."),
):
    # Edits an existing focus session.

    last_command = _read_last_command()
    if last_command != "list":
        typer.echo("You must run the 'list' command before editing.")
        raise typer.Exit(code=1)

    try:
        db_id = get_db_id(serial_number)  # Get database ID.
        date_format, date_value = parse_date_argument(date, "date") if date else (None, None)

        # Validate time format (HH:MM:SS).
        if start_time:
            if not re.match(r"^\d{2}:\d{2}:\d{2}$", start_time):
                typer.echo("Invalid start time format. Use HH:MM:SS (e.g., 08:30:00).")
                raise typer.Exit(code=1)
            try:  # Check for valid time values.
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

        success, message = edit_session(db_id, date_value, start_time, end_time)  # Edit session.
        typer.echo(message) # Output result.
        if success:  # only if edit is successful
            _write_last_command("edit")  # Update history *after* success.

    except ValueError as e:
        typer.echo(str(e)) # Error from get_db_id.
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
    """Displays a summary of focus sessions with filtering and sorting."""

    # Parse date arguments.
    since_format, since_value = parse_date_argument(since, "--since")
    until_format, until_value = parse_date_argument(until, "--until")
    month_format, month_value = parse_date_argument(month, "--month")
    date_format, date_value = parse_date_argument(date, "--date")

    # Validate --month.
    if month_value:
        if since_value or until_value or date_value:
            typer.echo("Error: Cannot use --month with --since, --until or --date.")
            raise typer.Exit(code=1)
        if month_format != "%Y-%m" and month_format != None:
            typer.echo("Error: Invalid --month format. Use YYYY-MM.")
            raise typer.Exit(code=1)

    # Validate --since and --until formats.
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

    # Validate --status.
    if status and status.lower() not in ("passed", "failed"):
        typer.echo("Error: --status must be either 'passed' or 'failed'.")
        raise typer.Exit(code=1)

    # Calculate summary.
    result = calculate_summary(sort_by=sort, date=date_value, since=since_value, until=until_value, month=month_value, status_filter=status, average_filter=average, total_filter=total)

    if result:
        typer.echo(result) # Output summary or message.

@app.command()
def rank():
    """Displays a leaderboard of focus session durations."""
    result = display_leaderboard()
    if result:
        typer.echo(result)

if __name__ == "__main__":
    app()