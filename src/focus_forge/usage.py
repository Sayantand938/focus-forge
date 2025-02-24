from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.text import Text
from rich.rule import Rule

def display_usage():
    """Display usage information for Focus Forge with enhanced visuals."""
    console = Console()

    # Styled Header
    header = Panel(
        Text("\nFocus Forge Usage\n", style="bold italic #a865c9", justify="center"),
        border_style="#a865c9", width=90, padding=(1, 2)
    )
    console.print(header, justify="center")

    # Markdown Content with Consistent Styling
    markdown_text = """
# 🚀 Focus Forge CLI - Quick Reference

Focus Forge helps you track your focus sessions efficiently. Here's how to use it:

## ✅ 1. Starting and Stopping Sessions

**Start a session:**
```bash
focus-forge start  # Begins tracking your time immediately.
```

**Stop a session:**
```bash
focus-forge stop  # Ends the current session and calculates duration.
```

**Manually add a session:**
```bash
focus-forge add "09:00 AM - 11:30 AM"  # Use 12-hour (AM/PM) format.
focus-forge add "14:00:00 - 17:45:00"  # Use 24-hour format.
```

## 📜 2. Viewing Your Sessions

**List all sessions:**
```bash
focus-forge list  # Shows sessions in a table with serial numbers.
```

**Sorting Options:**
```bash
focus-forge list --sort date       # Oldest to newest.
focus-forge list --sort date-desc  # Newest first (default).
focus-forge list --sort duration   # Shortest to longest.
```

**Filter by Date:**
```bash
focus-forge list --date 2024-01-15  # List sessions for a specific date.
focus-forge list --since 2024-01-01 --until 2024-01-15  # List within a date range.
focus-forge list --month 2024-01  # List all sessions in a specific month.
```
Supports keywords: `today`, `yesterday`, `last_week`, `this_month`.

## 🛠 3. Managing Sessions

**Delete a session:**
```bash
focus-forge delete 3  # Deletes session with serial number 3. ⚠️ This is permanent!
```

**Edit a session:**
```bash
focus-forge edit 2 --date 2024-01-20 --start-time 10:00 --end-time 12:00  # Modify date and time.
```

## 📊 4. Summaries

**Basic summary:**
```bash
focus-forge summary  # Shows daily totals, averages, and goal status.
```

**Filtered Summary:**
```bash
focus-forge summary --date 2024-01-15  # Show summary for a specific date.
focus-forge summary --status passed   # Show only passed days.
focus-forge summary --total lte:4h30m # Show sessions with total <= 4.5 hours.
```
Supports `gt` (greater than), `lt` (less than), `eq` (equal), etc.

## ⏳ 5. Duration Format

Use:
- `2h30m`
- `1h`
- `45m`
- `3600s`
    """
    
    # Styled Markdown Output
    markdown = Markdown(markdown_text, style="#f59157")
    console.print(Rule(style="#a865c9"))
    console.print(markdown)
    console.print(Rule(style="#a865c9"))