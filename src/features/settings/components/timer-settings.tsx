// src/features/settings/components/timer-settings.tsx
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/shared/ui/card";
import { Slider } from "@/shared/ui/slider";
import { useSettingsStore } from "../settings.store";

export function TimerSettings() {
  const focusDurationMinutes = useSettingsStore((state) => state.focusDurationMinutes);
  const setFocusDurationMinutes = useSettingsStore((state) => state.actions.setFocusDurationMinutes);

  const handleSliderChange = (value: number[]) => {
    setFocusDurationMinutes(value[0]);
  };

  return (
    <Card className="p-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6">
        <div className="space-y-1">
          <CardTitle>Timer Duration</CardTitle>
          <CardDescription>
            Set the length of a focus session in minutes.
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 w-full md:w-1/2">
          <Slider
            value={[focusDurationMinutes]}
            onValueChange={handleSliderChange}
            min={15}
            max={90}
            step={5}
            className="flex-1"
          />
          <span className="w-16 text-center font-mono text-lg">
            {focusDurationMinutes} min
          </span>
        </div>
      </div>
    </Card>
  );
}