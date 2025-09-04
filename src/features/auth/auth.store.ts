// src/features/auth/auth.store.ts
import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "./auth.service";
import { router } from "@/main"; 
import { useTodoStore } from "../todo-list/todo.store";
import { useFocusSheetStore } from "../focus-sheet/focus-sheet.store";
import { getFirebaseErrorMessage } from "@/shared/lib/utils";

export interface User {
  uid: string;
  name: string | null;
  email: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthReady: boolean; // New state to track if the listener is ready
  actions: {
    initializeListener: () => () => void; // Returns unsubscribe function
    signUp: (name: string, email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false, // Start as not ready
  actions: {
    initializeListener: () => {
      console.log("[AuthStore] Initializing auth state listener...");
      // The service returns the unsubscribe function
      const unsubscribe = authService.onAuthStateChange((user) => {
        console.log("[AuthStore] Auth state changed. User:", user);
        set({ user, isAuthenticated: !!user, isAuthReady: true });
      });
      return unsubscribe;
    },
    signUp: async (name, email, password) => {
      console.log(`[AuthStore] Attempting sign up for email: ${email}`);
      try {
        const user = await authService.signUp(name, email, password);
        toast.success(`Welcome, ${user.name}! Account created.`);
        // No need to set state here; the listener will do it automatically.
        await router.invalidate();
      } catch (error) {
        const message = getFirebaseErrorMessage(error);
        toast.error("Sign Up Failed", { description: message });
        throw error;
      }
    },
    login: async (email, password) => {
      console.log(`[AuthStore] Attempting login for email: ${email}`);
      try {
        const user = await authService.login(email, password);
        toast.success(`Welcome back, ${user.name}!`);
        // No need to set state here; the listener will do it automatically.
        await router.invalidate();
      } catch (error) {
        const message = getFirebaseErrorMessage(error);
        toast.error("Login Failed", { description: message });
        throw error;
      }
    },
    logout: async () => {
      console.log("[AuthStore] Logging out...");
      
      await authService.logout();
      // The listener will automatically update user and isAuthenticated state.

      // Clear the data from other stores.
      useTodoStore.getState().actions.clearData();
      useFocusSheetStore.getState().actions.clearData();
      
      // Invalidate the router to trigger route guards and redirect to /login.
      await router.invalidate();
    },
  },
}));