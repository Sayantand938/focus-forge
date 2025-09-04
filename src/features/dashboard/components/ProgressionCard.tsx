// src/features/dashboard/components/ProgressionCard.tsx
import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import type { Level } from "../lib/progression";

type ProgressionCardProps = {
  currentLevel: Level;
  totalXp: number;
  xpToNext: number;
  progressPercentage: number;
};

export function ProgressionCard({
  currentLevel,
  totalXp,
  xpToNext,
  progressPercentage,
}: ProgressionCardProps) {
  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-6 space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          <CardTitle className="text-base font-medium">
            Level {currentLevel.level} - {currentLevel.rank}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center gap-2">          
          <span className="text-3xl font-bold">{totalXp}</span>
          <span className="text-sm font-medium text-muted-foreground">
            Total XP
          </span>
        </div>
        
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {currentLevel.level} Progress</span>
            <span>{xpToNext > 0 ? `${xpToNext.toLocaleString()} XP to go` : 'Max Level!'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}