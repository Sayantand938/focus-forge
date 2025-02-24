# src/focus_forge/usage.py
import typer

def display_usage():
    """Display usage information for Focus Forge."""
    typer.echo("\n--------------------")
    typer.echo("Auto start/stop")
    typer.echo("--------------------\n")
    
    typer.echo("- focus-forge start")
    typer.echo("- focus-forge stop")
    
    typer.echo("\n--------------------")
    typer.echo("Manual start/stop")
    typer.echo("--------------------\n")
    
    typer.echo("- focus-forge add \"08:00 AM - 10:00 AM\"")
    
    typer.echo("\n--------------------")
    typer.echo("List Sessions")
    typer.echo("--------------------\n")
    
    typer.echo("- focus-forge list")
    typer.echo("- focus-forge list --date 2024-03-15")    
    typer.echo("- focus-forge list -d 2024-03-15")    
    typer.echo("- focus-forge list --month 2024-03")    
    typer.echo("- focus-forge list -m 2024-03")
    
    typer.echo("\n--------------------")
    typer.echo("Delete Session")
    typer.echo("--------------------\n")
    
    typer.echo("- focus-forge delete 3")
    
    typer.echo("\n--------------------")
    typer.echo("Edit Session")
    typer.echo("--------------------\n")
    
    typer.echo("- focus-forge edit 2 --start-time 08:30:00")
    typer.echo("- focus-forge edit 2 --end-time 17:00:00")
    typer.echo("- focus-forge edit 2 --date 2025-02-10")
    typer.echo("\n")

    typer.echo("\n--------------------")
    typer.echo("Summary")
    typer.echo("--------------------\n")
    
    typer.echo("- focus-forge summary")
    typer.echo("- focus-forge summary --date 2024-03-15")
    typer.echo("- focus-forge summary -d 2024-03-15")
    typer.echo("- focus-forge summary --month 2024-03")
    typer.echo("- focus-forge summary -m 2024-03")
    typer.echo("\n")