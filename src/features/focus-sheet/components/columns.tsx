// src/features/focus-sheet/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

import { FocusSession, useFocusSheetStore } from "../focus-sheet.store";
import { AddSessionSheet } from "./add-session-sheet";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

/**
 * A reusable component for the Actions column cell.
 * Manages the state for the edit sheet and dropdown menu.
 */
const ActionsCell = ({ session }: { session: FocusSession }) => {
  // --- FIX: Access removeSession from the nested 'actions' object ---
  const { removeSession } = useFocusSheetStore((state) => state.actions);
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
          <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>
            Edit Session
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => removeSession(session.id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* The sheet for editing the session, controlled by local state */}
      <AddSessionSheet
        isOpen={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        editingSession={session}
        selectedDate={session.date}
      />
    </>
  );
};

export const columns: ColumnDef<FocusSession>[] = [
  {
    header: "SL. NO",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(row.getValue("date"), "MMM d, yyyy"),
  },
  {
    header: "Time",
    cell: ({ row }) => {
      const { startTime, endTime } = row.original;
      return `${startTime} - ${endTime}`;
    },
  },
  {
    accessorKey: "duration",
    header: () => <div className="text-center">Duration</div>,
    cell: ({ row }) => (
      <div className="text-center">{`${row.getValue("duration")} min`}</div>
    ),
  },
  {
    accessorKey: "tag",
    header: "Tag",
    cell: ({ row }) => {
      const tag = row.getValue("tag") as string;
      return tag ? (
        <Badge variant="secondary">{tag}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "note",
    header: "Note",
    cell: ({ row }) => {
      const note = row.getValue("note") as string;
      if (!note) return <span className="text-muted-foreground">—</span>;
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="block max-w-[250px] truncate">{note}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs break-words">{note}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <ActionsCell session={row.original} />
      </div>
    ),
  },
];