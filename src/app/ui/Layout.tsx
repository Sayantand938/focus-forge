// File: src/app/ui/Layout.tsx
import { useEffect } from 'react';
import { Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/app/ui/Sidebar'
import { useTimerInterval } from '@/features/timer/useTimerInterval'
import { Toaster } from '@/shared/ui/sonner'
import { useTodoStore } from '@/features/todo-list/todo.store';
import { useFocusSheetStore } from '@/features/focus-sheet/focus-sheet.store';
import { useAuthStore } from '@/features/auth/auth.store';

export function Layout() {
  useTimerInterval();
  
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // When a user logs in (isAuthenticated becomes true), start the Firestore listeners.
  // The stores themselves prevent multiple listeners from being created.
  useEffect(() => {
    if (isAuthenticated) {
      console.log("[Layout] User is authenticated. Initializing feature data listeners...");
      useTodoStore.getState().actions.init();
      useFocusSheetStore.getState().actions.init();
    }
    // We don't need a cleanup function here because the logout action in the
    // auth store is responsible for calling clearData(), which unsubscribes.
  }, [isAuthenticated]);

  // The effect to sync the timer with settings has been removed as it's no longer needed.

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <Outlet />
      <Toaster position="top-right" richColors />
    </div>
  )
}