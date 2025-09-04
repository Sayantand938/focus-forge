// src/features/focus-sheet/index.tsx
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { isSameDay } from "date-fns";

import { useFocusSheetStore } from "./focus-sheet.store";
import { columns } from "./components/columns";
import { AddSessionSheet } from "./components/add-session-sheet";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { DataTable } from "@/shared/ui/data-table";
import { cn } from "@/shared/lib/utils";

export function FocusSheetFeature() {
  const allSessions = useFocusSheetStore((state) => state.sessions);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const filteredSessions = useMemo(() => {
    return allSessions.filter((session) => {
      const isDateMatch = isSameDay(session.date, selectedDate);
      if (!isDateMatch) return false;

      const searchLower = searchValue.toLowerCase();
      const isSearchMatch =
        searchValue === "" ||
        session.tag?.toLowerCase().includes(searchLower) ||
        session.note?.toLowerCase().includes(searchLower);
      
      return isSearchMatch;
    });
  }, [allSessions, selectedDate, searchValue]);

  return (
    <main className="flex-1 bg-background text-foreground py-12 px-4 md:px-8 space-y-8">
      <AddSessionSheet 
        isOpen={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
        selectedDate={selectedDate}
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Focus Sheet</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Showing sessions for {format(selectedDate, "MMMM do, yyyy")}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tag or note..."
              className="pl-10 bg-card border-border shadow-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setIsPopoverOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
              Add Session
            </Button>
          </div>
        </div>

        {filteredSessions.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredSessions}
            filterValue={searchValue}
            filterColumn="note"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-lg text-center p-4">
            <p className="text-xl font-semibold text-foreground">
              No sessions logged for {format(selectedDate, "MMMM do, yyyy")}.
            </p>
            <p className="text-muted-foreground mt-2">
              Try another date or log a new session.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}