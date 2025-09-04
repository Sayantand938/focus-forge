// src/app/ui/Sidebar.tsx
import {
  Mountain,
  LayoutGrid,
  Timer as TimerIcon,
  ListChecks,
  CheckSquare,
  Cog,
  LogOut,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { useAuthStore } from "@/features/auth/auth.store";

// Define navigation links with their paths, labels, and icons
const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/timer", label: "Timer", icon: TimerIcon },
  { href: "/focus-sheet", label: "Focus Sheet", icon: ListChecks },
  { href: "/todo-list", label: "Todo List", icon: CheckSquare },
  { href: "/settings", label: "Settings", icon: Cog },
];

export function Sidebar() {
  const { location } = useRouterState();
  const currentPath = location.pathname;

  const user = useAuthStore((state) => state.user);
  const { logout } = useAuthStore((state) => state.actions);

  const handleSignOut = async () => {
    toast.info("You have been signed out.");
    await logout();
  };

  return (
    <aside className="h-screen w-64 flex flex-col bg-card text-card-foreground border-r border-border">
      <header className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mountain />
          <span>Focus Forge</span>
        </h1>
      </header>
      <nav className="flex-1 px-4">
        <ul>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 my-1 rounded-md transition-colors",
                  currentPath === link.href
                    ? "bg-primary text-primary-foreground" // Active link style
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <footer className="p-4 border-t border-border flex flex-col gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </footer>
    </aside>
  );
}