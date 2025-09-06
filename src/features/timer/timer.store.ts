// File: src/features/timer/timer.store.ts
import { create } from "zustand";
import { toast } from "sonner";
import { useFocusSheetStore } from "@/features/focus-sheet/focus-sheet.store";

interface TimerState {
  timeElapsed: number;
  isActive: boolean;
  sessionStartTime: Date | null;
  actions: {
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    finishAndLogSession: () => void;
    tick: () => void;
  };
}

const formatTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const useTimerStore = create<TimerState>()((set, get) => ({
  timeElapsed: 0,
  isActive: false,
  sessionStartTime: null,
  actions: {
    startTimer: () => {
      console.log("[TimerStore] Action: startTimer");
      if (get().timeElapsed === 0) {
        set({ isActive: true, sessionStartTime: new Date() });
      } else {
        set({ isActive: true });
      }
    },
    pauseTimer: () => {
      console.log("[TimerStore] Action: pauseTimer");
      set({ isActive: false });
    },
    resetTimer: () => {
      console.log("[TimerStore] Action: resetTimer");
      set({ isActive: false, timeElapsed: 0, sessionStartTime: null });
    },
    finishAndLogSession: () => {
      const { timeElapsed, sessionStartTime } = get();

      if (timeElapsed < 60 || !sessionStartTime) {
        toast.warning("Session too short", {
          description: "Focus sessions must be at least 1 minute long to be logged.",
        });
        get().actions.resetTimer();
        return;
      }

      console.log("[TimerStore] Finishing and logging focus session.");
      const { addSession } = useFocusSheetStore.getState().actions;

      const endTime = new Date();
      const durationInMinutes = Math.round(timeElapsed / 60);

      addSession({
        date: endTime,
        startTime: formatTime(sessionStartTime),
        endTime: formatTime(endTime),
        duration: durationInMinutes,
        tag: "Timer",
        note: `Completed a ${durationInMinutes}-minute focus session.`,
      }, false);

      toast.success("Focus session logged!", {
        description: `Great job on your ${durationInMinutes}-minute session.`,
      });

      // --- The desktop notification call has been removed from here. ---

      get().actions.resetTimer();
    },
    tick: () =>
      set((state) => {
        if (state.isActive) {
          return { timeElapsed: state.timeElapsed + 1 };
        }
        return {};
      }),
  },
}));