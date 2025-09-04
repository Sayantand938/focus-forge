// src/features/dashboard/components/ShiftCard.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";

type ShiftCardProps = {
  title: string;
  icon: React.ElementType;
  currentMinutes: number;
  goalMinutes: number;
};

export function ShiftCard({
  title,
  icon: Icon,
  currentMinutes,
  goalMinutes,
}: ShiftCardProps) {
  const progress =
    goalMinutes > 0 ? (currentMinutes / goalMinutes) * 100 : 0;
  const clampedProgress = Math.min(progress, 100); // Ensure progress doesn't exceed 100%

  return (
    <Card className="flex flex-col gap-2 p-4">
      <CardHeader className="p-0">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>{title}</span>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-2">
        <div className="text-2xl font-bold">
          {currentMinutes}{" "}
          <span className="text-sm font-medium text-muted-foreground">
            / {goalMinutes} min
          </span>
        </div>
        <Progress value={clampedProgress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {clampedProgress.toFixed(0)}% complete
        </p>
      </CardContent>
    </Card>
  );
}