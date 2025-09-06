// File: src/features/settings/index.tsx
import {
 Card,
 CardDescription,
 CardTitle,
} from "@/shared/ui/card";
import { ThemeSwitcher } from "./components/theme-switcher";
import { DataManagement } from "./components/data-management";
import { ResetData } from "./components/reset-data";

export function SettingsFeature() {
 return (
  <main className="flex-1 bg-background text-foreground py-12 px-4 md:px-8 space-y-8">
   <div className="space-y-6">
    <div>
     <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
     <p className="text-lg text-muted-foreground mt-1">
      Customize the appearance and behavior of the application.
     </p>
    </div>

    {/* The TimerSettings component has been removed from here */}

    <Card className="p-0">
     <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6">
      <div className="space-y-1 mb-4 md:mb-0">
       <CardTitle>Appearance</CardTitle>
       <CardDescription>
        Select your preferred theme. The "System" theme will match your
        operating system's appearance.
       </CardDescription>
      </div>
      <ThemeSwitcher />
     </div>
    </Card>

    <DataManagement />

    <ResetData />
   </div>
  </main>
 );
}