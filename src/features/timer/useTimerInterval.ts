// File: src/features/timer/useTimerInterval.ts
import { useEffect } from "react";
import { useTimerStore } from "./timer.store";

/**
 * A hook that manages the timer interval based on the global Zustand store.
 * This should be placed in a component that persists across all pages, like the main Layout.
 */
export function useTimerInterval() {
  const isActive = useTimerStore((state) => state.isActive);
  const tick = useTimerStore((state) => state.actions.tick);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // The interval now only depends on whether the timer is active.
    if (isActive) {
      console.log("[useTimerInterval] Setting up interval.");
      intervalId = setInterval(() => {
        tick(); // Call the tick action from the store
      }, 1000);
    }

    return () => {
      if (intervalId) {
        console.log("[useTimerInterval] Clearing interval.");
        clearInterval(intervalId);
      }
    };
  }, [isActive, tick]);
}