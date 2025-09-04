import { useEffect } from "react";
import { useTimerStore } from "./timer.store";

/**
 * A hook that manages the timer interval based on the global Zustand store.
 * This should be placed in a component that persists across all pages, like the main Layout.
 */
export function useTimerInterval() {
  const isActive = useTimerStore((state) => state.isActive);
  const timeLeft = useTimerStore((state) => state.timeLeft);
  const tick = useTimerStore((state) => state.actions.tick);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
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
  }, [isActive, timeLeft, tick]);
}