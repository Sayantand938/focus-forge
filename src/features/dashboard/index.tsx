// src/features/dashboard/index.tsx
import { useMemo } from "react";
import { isToday, format } from "date-fns";
import { Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { useFocusSheetStore } from "../focus-sheet/focus-sheet.store";
import { ShiftCard } from "./components/ShiftCard";
import { ProgressionCard } from "./components/ProgressionCard";
import { StatsCard } from "./components/StatsCard";
import { calculateProgression } from "./lib/progression";

// Define shift goals and metadata
const SHIFT_GOAL_MINUTES = 120;
const shifts = [
  { name: "Morning", icon: Sunrise, startHour: 0 },
  { name: "Afternoon", icon: Sun, startHour: 12 },
  { name: "Evening", icon: Sunset, startHour: 16 },
  { name: "Night", icon: Moon, startHour: 20 },
];

export function DashboardFeature() {
  const sessions = useFocusSheetStore((state) => state.sessions);

  // --- All-Time Stats and Progression Calculation ---
  const { progression, stats } = useMemo(() => {
    // All-Time Stats
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionsLogged = sessions.length;
    const longestSession = Math.max(0, ...sessions.map((s) => s.duration));

    const dailyTotals = sessions.reduce((acc, session) => {
      const dateStr = format(session.date, "yyyy-MM-dd");
      acc[dateStr] = (acc[dateStr] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

    let bestDay = { date: null as string | null, duration: 0 };
    for (const [dateStr, duration] of Object.entries(dailyTotals)) {
      if (duration > bestDay.duration) {
        bestDay = { date: dateStr, duration };
      }
    }

    // Progression (1 min = 1 XP)
    const progressionData = calculateProgression(totalMinutes);

    console.log("[Dashboard] Calculated All-Time Stats:", { totalMinutes, sessionsLogged, longestSession, bestDay });
    console.log("[Dashboard] Calculated Progression:", progressionData);
    
    return {
      progression: progressionData,
      stats: {
        totalFocusHours: Math.floor(totalMinutes / 60),
        totalFocusMinutes: totalMinutes % 60,
        sessionsLogged,
        longestSession,
        bestDay,
      }
    };
  }, [sessions]);


  // --- Today's Shift Calculation ---
  const todayShiftTotals = useMemo(() => {
    const totals = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    const todaySessions = sessions.filter((s) => isToday(s.date));

    for (const session of todaySessions) {
      const startHour = parseInt(session.startTime.split(":")[0], 10);
      if (startHour >= 0 && startHour < 12) totals.Morning += session.duration;
      else if (startHour >= 12 && startHour < 16) totals.Afternoon += session.duration;
      else if (startHour >= 16 && startHour < 20) totals.Evening += session.duration;
      else if (startHour >= 20 && startHour < 24) totals.Night += session.duration;
    }
    console.log("[Dashboard] Calculated Today's Shift Totals:", totals);
    return totals;
  }, [sessions]);


  return (
    <main className="flex-1 bg-background text-foreground py-12 px-4 md:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-1">
          An overview of your focus journey.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="space-y-6">
        {/* Top Row: Shift Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {shifts.map((shift) => (
            <ShiftCard
              key={shift.name}
              title={shift.name}
              icon={shift.icon}
              currentMinutes={todayShiftTotals[shift.name as keyof typeof todayShiftTotals]}
              goalMinutes={SHIFT_GOAL_MINUTES}
            />
          ))}
        </div>
        
        {/* Second Row: Progression and Stats */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <ProgressionCard {...progression} />
          <StatsCard {...stats} />
        </div>
      </div>
    </main>
  );
}