// src/features/settings/components/theme-switcher.tsx
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/tabs"; // Assuming you have a Tabs component in your shared UI library

// Define the available theme options
const themeOptions = [
  { name: "Light", value: "light", icon: Sun },
  { name: "Dark", value: "dark", icon: Moon },
  { name: "System", value: "system", icon: Laptop },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Tabs value={theme} onValueChange={setTheme}>
      <TabsList>
        {themeOptions.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            <option.icon className="h-4 w-4" />
            <span>{option.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}