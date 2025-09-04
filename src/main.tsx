// src/main.tsx

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "next-themes";
import {
  RouterProvider,
  Router,
  Route,
  RootRoute,
  redirect,
  Outlet,
  useRouterState, // Import useRouterState
  Navigate, // Import Navigate
} from "@tanstack/react-router";
import { attachConsole } from "@tauri-apps/plugin-log";

import "./app/styles.css";

// Import stores
import { useAuthStore } from "@/features/auth/auth.store";

// Application Layout
import { Layout } from "@/app/ui/Layout";

// Feature Components
import { LoginPage } from "@/features/auth/ui/LoginPage";
import { DashboardFeature } from "@/features/dashboard";
import { TimerFeature } from "@/features/timer";
import { FocusSheetFeature } from "@/features/focus-sheet";
import { TodoListFeature } from "@/features/todo-list";
import { SettingsFeature } from "@/features/settings";
import { Skeleton } from "./shared/ui/skeleton";

// --- Router Setup ---

const rootRoute = new RootRoute({
  component: function Root() {
    const isAuthReady = useAuthStore((s) => s.isAuthReady);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { location } = useRouterState();

    // 1. While Firebase is checking for a user, show a loading screen.
    if (!isAuthReady) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="w-64 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      );
    }

    // 2. Auth is ready. If the user is NOT authenticated and is trying to
    // access a protected page, redirect them to login.
    if (!isAuthenticated && location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }

    // 3. If the user IS authenticated and they land on the login page,
    // redirect them to the dashboard.
    if (isAuthenticated && location.pathname === "/login") {
      return <Navigate to="/dashboard" replace />;
    }

    // 4. If none of the above, render the requested route.
    return <Outlet />;
  },
});

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  // REMOVE the beforeLoad guard from here. The RootRoute now handles it.
});

const authenticatedRoute = new Route({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  component: Layout,
  // REMOVE the beforeLoad guard from here. The RootRoute now handles it.
});

const indexRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  beforeLoad: () => {
    // This redirect is fine as it's for the root path only
    throw redirect({ to: "/dashboard" });
  },
});

const dashboardRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/dashboard",
  component: DashboardFeature,
});
const timerRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/timer",
  component: TimerFeature,
});
const focusSheetRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/focus-sheet",
  component: FocusSheetFeature,
});
const todoListRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/todo-list",
  component: TodoListFeature,
});
const settingsRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/settings",
  component: SettingsFeature,
});

const authenticatedChildren = [
  indexRoute,
  dashboardRoute,
  timerRoute,
  focusSheetRoute,
  todoListRoute,
  settingsRoute,
];

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren(authenticatedChildren),
]);

const router = new Router({ routeTree });
export { router };

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  // Initialize the auth listener when the app mounts
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().actions.initializeListener();
    // Clean up the listener when the app unmounts
    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

// Attach the logger for Tauri development.
attachConsole();

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}