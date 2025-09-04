// src/features/focus-sheet/components/add-session-sheet.tsx
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { format, parse, isSameDay, subMinutes } from "date-fns";
import { CalendarIcon } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import { cn } from "@/shared/lib/utils";
import { useFocusSheetStore, type FocusSession } from "../focus-sheet.store";
import { AddEditSheet } from "@/shared/components/add-edit-sheet"; // Import the generic component

// Zod schema for form validation
const formSchema = z
  .object({
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
    date: z.date(),
    tag: z.string().optional(),
    note: z.string().optional(),
    duration: z.number().int().min(1).max(99), // Only 1-99 minutes
  })
  .refine(
    (data) => {
      // Ensure calculated start time is valid (end - duration doesn't go negative)
      const endTime = parse(data.endTime, "HH:mm", new Date());
      const startTime = new Date(endTime.getTime() - data.duration * 60 * 1000);
      return startTime.getTime() <= endTime.getTime();
    },
    {
      message: "Start time would be invalid.",
      path: ["duration"],
    }
  );

// Helper to format time as HH:mm
const formatTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

type AddSessionSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingSession?: FocusSession | null;
  selectedDate: Date;
};

export function AddSessionSheet({
  isOpen,
  onOpenChange,
  editingSession,
  selectedDate,
}: AddSessionSheetProps) {
  // --- FIX: Destructure functions from the nested 'actions' object ---
  const { addSession, updateSession } = useFocusSheetStore(
    (state) => state.actions
  );

  const isEditing = !!editingSession;

  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: formatTime(thirtyMinutesAgo),
      endTime: formatTime(now),
      date: selectedDate,
      tag: "",
      note: "",
      duration: 30,
    },
  });

  const watchedEndTime = form.watch("endTime");
  const watchedDuration = form.watch("duration");
  const watchedDate = form.watch("date");

  // Sync form with editingSession or reset for new session
  useEffect(() => {
    if (isOpen) {
      if (isEditing && editingSession) {
        form.reset({
          startTime: editingSession.startTime,
          endTime: editingSession.endTime,
          date: editingSession.date,
          tag: editingSession.tag || "",
          note: editingSession.note || "",
          duration: editingSession.duration,
        });
      } else {
        // New session: default to now and -30min
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        form.reset({
          startTime: formatTime(thirtyMinutesAgo),
          endTime: formatTime(now),
          date: selectedDate,
          tag: "",
          note: "",
          duration: 30,
        });
      }
    }
  }, [isOpen, isEditing, editingSession, selectedDate, form]);

  // Update startTime whenever endTime or duration changes
  useEffect(() => {
    if (!watchedEndTime || !watchedDuration || !watchedDate) return;

    try {
      // 1. Create a full Date object using the selected DATE and the entered END TIME
      const endTimeOnSelectedDate = parse(watchedEndTime, "HH:mm", watchedDate);

      // 2. Reliably subtract the duration to get the correct start Date object
      const newStartDate = subMinutes(endTimeOnSelectedDate, watchedDuration);
      
      // 3. Format the new start time
      const newStartTime = format(newStartDate, "HH:mm");

      // 4. Update the start time field if it has changed
      if (form.getValues("startTime") !== newStartTime) {
        form.setValue("startTime", newStartTime, { shouldValidate: true });
      }

      // 5. (Bonus) If subtracting the duration crossed a day boundary,
      //    automatically update the date field to the new, correct date.
      if (!isSameDay(newStartDate, watchedDate)) {
        form.setValue("date", newStartDate, { shouldValidate: true });
      }
    } catch (error) {
      // This can happen if the time string is temporarily invalid. Ignore.
    }
  }, [watchedEndTime, watchedDuration, watchedDate, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const sessionData = {
      ...values,
      duration: values.duration, // Already included
    };

    if (isEditing && editingSession) {
      console.log("[FocusSheet] Updating session:", { id: editingSession.id, ...sessionData });
      updateSession({ ...editingSession, ...sessionData });
    } else {
      console.log("[FocusSheet] Adding new session:", sessionData);
      addSession(sessionData);
    }

    onOpenChange(false);
  }

  return (
    <AddEditSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      isEditing={isEditing}
      title={isEditing ? "Edit Focus Session" : "Add New Focus Session"}
      description={
        isEditing
          ? "Update the details of your session."
          : "Log a study or work session you completed."
      }
    >
      {/* The form fields specific to focus sessions */}
      <div className="space-y-2">
        <FormLabel>Duration (min)</FormLabel>
        <div className="flex items-center gap-2">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={field.value}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      if (value >= 1 && value <= 99) {
                        field.onChange(value);
                      } else if (e.target.value === "") {
                        field.onChange(0); // Allow clearing
                      }
                    }}
                    onBlur={() => {
                      // Ensure valid value on blur
                      if (!field.value || field.value < 1) {
                        form.setValue("duration", 1, { shouldValidate: true });
                      } else if (field.value > 99) {
                        form.setValue("duration", 99, { shouldValidate: true });
                      }
                    }}
                    placeholder="30"
                    className="bg-input border-border"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input
                  type="time"
                  {...field}
                  className="bg-input border-border"
                  readOnly // Prevent manual edit — derived from end + duration
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input
                  type="time"
                  {...field}
                  className="bg-input border-border"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal bg-input border-border",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tag"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tag (Optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Project A, Studying"
                {...field}
                className="bg-input border-border"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Note (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What did you work on?"
                {...field}
                className="bg-input border-border"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </AddEditSheet>
  );
}