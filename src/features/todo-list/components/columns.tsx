// File: src/features/todo-list/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/shared/lib/utils";
import { useState } from "react";

import { Todo, useTodoStore } from "../todo.store";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { StatusToggle } from "./StatusToggle";
import { AddTodoSheet } from "./add-todo-sheet";

const priorityIcons = {
  High: <ArrowUp className="h-4 w-4 text-red-500" />,
  Medium: <ArrowRight className="h-4 w-4 text-yellow-500" />,
  Low: <ArrowDown className="h-4 w-4 text-green-500" />,
  None: null,
};

/**
 * A reusable component for the Actions column cell.
 * Manages the state for the edit sheet and dropdown menu.
 */
const ActionsCell = ({ todo }: { todo: Todo }) => {
  const { removeTodo } = useTodoStore((state) => state.actions);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(todo.task)}>
            Copy Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>
            Edit Task
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => removeTodo(todo.id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Sheet */}
      <AddTodoSheet
        isOpen={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        editingTodo={todo}
      />
    </>
  );
};


export const columns: ColumnDef<Todo>[] = [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const todo = row.original;
      return <StatusToggle id={todo.id} currentStatus={todo.status} />;
    },
  },
  {
    accessorKey: "tag",
    header: "Tag",
    cell: ({ row }) => {
      const tag = row.getValue("tag") as string;
      return tag ? (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          {tag}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "priority",
    header: () => <div className="text-center">Priority</div>,
    cell: ({ row }) => {
      const priority = row.getValue("priority") as Todo["priority"];
      return (
        <div className="flex items-center justify-center gap-2">
          {priorityIcons[priority]}
          <span>{priority}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Added",
    // --- FIX: Add a check to ensure the date is valid before formatting ---
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      return createdAt ? format(createdAt, "MMM d, yyyy") : "Processing...";
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    // --- FIX: This check was already good, but let's keep it consistent ---
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as Date | undefined;
      return dueDate ? format(dueDate, "MMM d, yyyy") : "N/A";
    },
  },
  {
    accessorKey: "task",
    header: "Task",
    cell: ({ row }) => {
      const status = row.original.status;
      const task = row.getValue("task") as string;
      return (
        <span
          className={cn(
            "max-w-[400px] truncate block",
            status === "Completed" && "line-through text-muted-foreground"
          )}
        >
          {task}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <ActionsCell todo={row.original} />
      </div>
    ),
  },
];