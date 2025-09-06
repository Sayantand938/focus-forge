// File: src/features/timer/index.tsx
import { useTimerStore } from "./timer.store";
import { Button } from "@/shared/ui/button";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";
// Import Tooltip components for accessibility
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

export function TimerFeature() {
  const timeElapsed = useTimerStore((state) => state.timeElapsed);
  const isActive = useTimerStore((state) => state.isActive);
  const { startTimer, pauseTimer, resetTimer, finishAndLogSession } = useTimerStore(
    (state) => state.actions
  );

  /**
   * Toggles the timer between active and paused states.
   */
  const handleToggleTimer = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  /**
   * Formats the total seconds into a HH:MM:SS string.
   */
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedHours = String(hours).padStart(2, "0");
    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  };

  return (
    <main className="flex-1 bg-background text-foreground flex flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold">Focus Session</h2>
        <p className="text-muted-foreground mt-2">
          Start the timer to begin a focus session.
        </p>
      </div>

      <div className="relative my-12 w-96 h-40 flex items-center justify-center">
        <span className="text-8xl font-mono font-bold tracking-wider">
          {formatTime(timeElapsed)}
        </span>
      </div>

      {/* --- MODIFICATION START: Icon-Only Timer Controls --- */}
      <div className="flex items-center justify-center gap-6 h-20">
        {/* Reset Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={resetTimer}
                variant="ghost"
                size="icon"
                className={`rounded-full h-16 w-16 text-muted-foreground transition-opacity duration-300 ${
                  timeElapsed > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                aria-label="Reset Timer"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Main Play/Pause Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleToggleTimer}
                variant="secondary"
                size="icon"
                className="rounded-full h-20 w-20"
                aria-label={isActive ? "Pause Timer" : "Start Timer"}
              >
                {isActive ? (
                  <Pause className="h-8 w-8 fill-current" />
                ) : (
                  <Play className="h-8 w-8 fill-current ml-1" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isActive ? "Pause" : timeElapsed > 0 ? "Resume" : "Start"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Finish & Log Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={finishAndLogSession}
                variant="ghost"
                size="icon"
                className={`rounded-full h-16 w-16 text-muted-foreground transition-opacity duration-300 ${
                  timeElapsed > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                aria-label="Finish and Log Session"
              >
                <Flag className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Finish & Log</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* --- MODIFICATION END --- */}
    </main>
  );
}