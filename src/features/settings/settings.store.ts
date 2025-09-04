// src/features/settings/settings.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SETTINGS_STORAGE_KEY } from "@/shared/config/constants";

export interface SettingsState {
  focusDurationMinutes: number;
  _hasHydrated: boolean;
  actions: {
    setFocusDurationMinutes: (minutes: number) => void;
    reset: () => void;
  };
}

// Define the initial state to easily reset to it.
const initialState = {
  focusDurationMinutes: 30,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      _hasHydrated: false,
      actions: {
        setFocusDurationMinutes: (minutes) => {
          console.log(
            `[SettingsStore] Setting focus duration to ${minutes} minutes.`
          );
          set({ focusDurationMinutes: minutes });
        },
        reset: () => {
          console.log("[SettingsStore] Resetting settings to default.");
          set(initialState);
        },
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY, // Use shared constant
      storage: createJSONStorage(() => localStorage), // Use default localStorage
      partialize: (state) => ({
        focusDurationMinutes: state.focusDurationMinutes,
      }),
      onRehydrateStorage: () => () => {
        console.log("[SettingsStore] Hydration complete.");
        useSettingsStore.setState({ _hasHydrated: true });
      },
    }
  )
);