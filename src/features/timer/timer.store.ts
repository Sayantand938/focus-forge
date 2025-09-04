// src/features/timer/timer.store.ts
import { create } from "zustand";
import { toast } from "sonner";
import { useFocusSheetStore } from "@/features/focus-sheet/focus-sheet.store";
import { showNotification } from "@/shared/lib/notifications";
import { useSettingsStore } from "@/features/settings/settings.store";

interface TimerState {
  timeLeft: number;
  isActive: boolean;
  actions: {
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    tick: () => void;
  };
}

const formatTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Helper to get the current duration from the settings store
const getDurationSeconds = () => useSettingsStore.getState().focusDurationMinutes * 60;

export const useTimerStore = create<TimerState>()((set) => ({
  timeLeft: getDurationSeconds(),
  isActive: false,
  actions: {
    startTimer: () => {
      console.log("[TimerStore] Action: startTimer");
      set({ isActive: true });
    },
    pauseTimer: () => {
      console.log("[TimerStore] Action: pauseTimer");
      set({ isActive: false });
    },
    resetTimer: () => {
      console.log("[TimerStore] Action: resetTimer");
      set({ isActive: false, timeLeft: getDurationSeconds() });
    },
    tick: () =>
      set((state) => {
        if (state.timeLeft > 1) {
          return { timeLeft: state.timeLeft - 1 };
        }

        if (state.timeLeft === 1) {
          console.log("[TimerStore] Timer completed. Logging focus session.");
          const { addSession } = useFocusSheetStore.getState().actions;
          const focusDurationMinutes = useSettingsStore.getState().focusDurationMinutes;
          
          const now = new Date();
          const startTimeDate = new Date(now.getTime() - focusDurationMinutes * 60 * 1000);

          addSession({
            date: now,
            startTime: formatTime(startTimeDate),
            endTime: formatTime(now),
            duration: focusDurationMinutes,
            tag: "Pomodoro",
            note: "Completed a focus session using the timer.",
          });

          // Show a toast as an in-app confirmation
          toast.success("Focus session complete!", {
            description: "Great job! Time for a well-deserved break.",
          });
          
          // Send a desktop notification
          showNotification({
            title: "Focus Session Complete!",
            body: "Great job! Time for a well-deserved break.",
          });
          
          return { timeLeft: 0, isActive: false };
        }

        return { isActive: false };
      }),
  },
}));

// Listen for changes in the settings store. If the duration changes
// while the timer is not active, reset the timer to the new duration.
useSettingsStore.subscribe(
  (newState, oldState) => {
    if (newState.focusDurationMinutes !== oldState.focusDurationMinutes) {
      const timerState = useTimerStore.getState();
      if (!timerState.isActive) {
        console.log("[TimerStore] Duration setting changed. Resetting timer.");
        timerState.actions.resetTimer();
      }
    }
  }
);