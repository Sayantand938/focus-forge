// src/features/todo-list/components/add-todo-sheet.tsx
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import { cn } from "@/shared/lib/utils";
import { useTodoStore, type Todo } from "../todo.store";
import { AddEditSheet } from "@/shared/components/add-edit-sheet"; // Import the generic component

// Allow null for form, but convert to undefined before saving
const formSchema = z.object({
  task: z.string().min(3, "Task must be at least 3 characters."),
  tag: z.string().optional(),
  dueDate: z.date().nullable().optional(),
  priority: z.enum(["None", "Low", "Medium", "High"]),
});

type AddTodoSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingTodo?: Todo | null;
};

export function AddTodoSheet({ isOpen, onOpenChange, editingTodo }: AddTodoSheetProps) {
  // --- FIX: Destructure functions from the nested 'actions' object ---
  const { addTodo, updateTodo } = useTodoStore((state) => state.actions);

  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const isEditing = !!editingTodo;

  const defaultValues = isEditing
    ? {
        task: editingTodo.task,
        tag: editingTodo.tag || "",
        dueDate: editingTodo.dueDate || null,
        priority: editingTodo.priority,
      }
    : {
        task: "",
        tag: "",
        dueDate: null,
        priority: "None" as const,
      };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Sync form when editingTodo changes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && editingTodo) {
        form.reset({
          task: editingTodo.task,
          tag: editingTodo.tag || "",
          dueDate: editingTodo.dueDate || null,
          priority: editingTodo.priority,
        });
      } else {
        form.reset({
          task: "",
          tag: "",
          dueDate: null,
          priority: "None",
        });
      }
    }
  }, [isOpen, isEditing, editingTodo, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const dueDate = values.dueDate === null ? undefined : values.dueDate;

    if (isEditing && editingTodo) {
      const updatedTodo: Todo = {
        ...editingTodo,
        ...values,
        dueDate,
      };
      console.log("[TodoSheet] Updating todo:", updatedTodo);
      updateTodo(updatedTodo);
    } else {
      const newTodo = {
        ...values,
        dueDate,
      };
      console.log("[TodoSheet] Adding new todo:", newTodo);
      addTodo(newTodo);
    }

    form.reset();
    onOpenChange(false);
  }

  return (
    <AddEditSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      isEditing={isEditing}
      title={isEditing ? "Edit Task" : "Add New Todo"}
      description={isEditing ? "Update your task details." : "Add a new task to your list."}
    >
      {/* The form fields specific to todos */}
      <FormField
        control={form.control}
        name="task"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Task</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What needs to be done? e.g., Finish project report"
                {...field}
                className="bg-input border-border"
              />
            </FormControl>
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
                placeholder="e.g., Work, Personal"
                {...field}
                className="bg-input border-border"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="dueDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Due Date (Optional)</FormLabel>
            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal bg-input border-border hover:bg-muted",
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
                  selected={field.value || undefined}
                  onSelect={(date) => {
                    field.onChange(date);
                    setIsDatePopoverOpen(false);
                  }}
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
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Priority</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(["None", "Low", "Medium", "High"] as const).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </AddEditSheet>
  );
}