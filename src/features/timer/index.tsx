import { useTimerStore } from "./timer.store";
import { Button } from "@/shared/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useSettingsStore } from "../settings/settings.store";

// Constants for the SVG circular progress bar
const SVG_SIZE = 320;
// Increased the stroke width for a thicker fill
const STROKE_WIDTH = 15; 
// The radius must be recalculated to account for the new stroke width
const RADIUS = SVG_SIZE / 2 - STROKE_WIDTH / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerFeature() {
  // 1. Get state and actions directly from the global store
  const timeLeft = useTimerStore((state) => state.timeLeft);
  const isActive = useTimerStore((state) => state.isActive);
  const { startTimer, pauseTimer, resetTimer } = useTimerStore(
    (state) => state.actions
  );
  const focusDurationMinutes = useSettingsStore((state) => state.focusDurationMinutes);
  const totalDurationSeconds = focusDurationMinutes * 60;

  /**
   * Toggles the timer by calling the appropriate action from the store.
   */
  const handleToggleTimer = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  /**
   * Formats the remaining seconds into a MM:SS string.
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // Calculate the progress percentage (0 to 1)
  const progress = totalDurationSeconds > 0 ? timeLeft / totalDurationSeconds : 0;
  // Calculate the stroke offset for the circular progress bar
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <main className="flex-1 bg-background text-foreground flex flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold">Focus Session</h2>
        <p className="text-muted-foreground mt-2">
          Start the timer and concentrate for {focusDurationMinutes} minutes.
        </p>
      </div>

      <div className="relative my-12 w-80 h-80 flex items-center justify-center">
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RADIUS}
            className="stroke-muted-foreground/30"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
          />
          {/* Progress circle fill */}
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RADIUS}
            className="stroke-foreground"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 1s linear",
            }}
          />
        </svg>
        <span className="absolute text-7xl font-mono font-bold tracking-wider">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <Button
          onClick={handleToggleTimer}
          size="lg"
          variant="secondary"
        >
          {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
          {isActive ? "Pause" : "Start"}
        </Button>
        <Button
          onClick={resetTimer} // Use the action directly
          variant="ghost"
          size="lg"
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw size={16} />
          Reset
        </Button>
      </div>
    </main>
  );
}