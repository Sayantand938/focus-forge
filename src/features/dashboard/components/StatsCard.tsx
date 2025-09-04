// src/features/dashboard/components/StatsCard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Clock, Trophy, BookOpenText , CalendarDays } from "lucide-react";
import { format } from "date-fns";

type StatsCardProps = {
  totalFocusHours: number;
  totalFocusMinutes: number;
  sessionsLogged: number;
  longestSession: number;
  bestDay: { date: string | null; duration: number };
};

const StatItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center gap-3">
    <Icon className="h-6 w-6 text-muted-foreground" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  </div>
);

export function StatsCard({
  totalFocusHours,
  totalFocusMinutes,
  sessionsLogged,
  longestSession,
  bestDay,
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4 gap-0">
        <CardTitle className="text-base font-medium">
          All-Time Statistics
        </CardTitle>
        <CardDescription>
          Your lifetime focus journey at a glance.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-2 gap-x-4 gap-y-4">
        <StatItem 
          icon={Clock}          
          label="Total Focus" 
          value={`${totalFocusHours}h ${totalFocusMinutes}m`} 
        />
        <StatItem 
          icon={BookOpenText} 
          label="Sessions Logged" 
          value={sessionsLogged} 
        />
        <StatItem 
          icon={Trophy} 
          label="Longest Session" 
          value={`${longestSession} min`} 
        />
        <StatItem 
          icon={CalendarDays} 
          label="Best Day" 
          value={bestDay.date ? format(new Date(bestDay.date), "MMM d, yyyy") : "N/A"} 
        />
      </CardContent>
    </Card>
  );
}