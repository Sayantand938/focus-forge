// src/shared/lib/data-management.service.ts
import { z } from "zod";
import { toast } from "sonner";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

import { todoService } from "@/features/todo-list/todo.service";
import { focusSheetService } from "@/features/focus-sheet/focus-sheet.service";
import { useSettingsStore, type SettingsState } from "@/features/settings/settings.store";
import { useTodoStore } from "@/features/todo-list/todo.store";
import { useFocusSheetStore } from "@/features/focus-sheet/focus-sheet.store";

// Zod schemas for validation during import
// We now expect ISO strings for dates from the JSON file.
const todoSchema = z.object({
  id: z.string(), // ID is now a string from Firestore
  task: z.string(),
  tag: z.string().optional().nullable(),
  priority: z.enum(["None", "Low", "Medium", "High"]),
  dueDate: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  status: z.enum(["Pending", "In Progress", "Completed"]),
});

const sessionSchema = z.object({
  id: z.string(), // ID is now a string from Firestore
  date: z.string().datetime(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
  tag: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

const settingsSchema = z.object({
  focusDurationMinutes: z.number(),
});

const backupSchema = z.object({
  version: z.number().optional().default(1),
  exportedAt: z.string().datetime(),
  todos: z.array(todoSchema),
  sessions: z.array(sessionSchema),
  settings: settingsSchema,
});

type BackupData = z.infer<typeof backupSchema>;

// Helper to deserialize imported data, converting ISO strings back to Date objects
const deserializeImportedData = (data: BackupData) => {
  const todos = data.todos.map((t) => ({
    ...t,
    tag: t.tag ?? undefined,
    // Firestore stores dates as Timestamps, which are serialized to ISO strings in JSON.
    // We convert them back to Date objects for our application state.
    createdAt: new Date(t.createdAt),
    dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
  }));

  const sessions = data.sessions.map((s) => ({
    ...s,
    tag: s.tag ?? undefined,
    note: s.note ?? undefined,
    date: new Date(s.date),
  }));

  const settings: Pick<SettingsState, "focusDurationMinutes"> = {
    focusDurationMinutes: data.settings.focusDurationMinutes,
  };

  return { todos, sessions, settings };
};

export const dataManagementService = {
  async exportData(): Promise<void> {
    toast.info("Preparing your data for export...");
    try {
      // Get the current state directly from the stores, which are always up-to-date.
      const todos = useTodoStore.getState().todos;
      const sessions = useFocusSheetStore.getState().sessions;
      const settings = useSettingsStore.getState();

      // Convert Date objects to ISO strings for JSON serialization
      // --- FIX: Filter out any items that don't have a valid date yet ---
      const serializableTodos = todos
        .filter(todo => todo.createdAt instanceof Date)
        .map(todo => ({
          ...todo,
          createdAt: todo.createdAt.toISOString(),
          dueDate: todo.dueDate?.toISOString() ?? null,
        }));

      const serializableSessions = sessions
        .filter(session => session.date instanceof Date)
        .map(session => ({
          ...session,
          date: session.date.toISOString(),
        }));

      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        todos: serializableTodos,
        sessions: serializableSessions,
        settings: {
          focusDurationMinutes: settings.focusDurationMinutes,
        },
      };

      const filePath = await save({
        defaultPath: `focus-forge-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (!filePath) {
        toast.info("Export cancelled.");
        return;
      }

      await writeTextFile(filePath, JSON.stringify(backupData, null, 2));
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("[DataExport] Failed to export data:", error);
      toast.error("Export Failed", {
        description: "An error occurred while exporting your data.",
      });
    }
  },

  async importData(): Promise<void> {
    let toastId: string | number | undefined;

    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (!filePath || Array.isArray(filePath)) {
        toast.info("Import cancelled.");
        return; // User cancelled or selected multiple files
      }

      const content = await readTextFile(filePath);
      const rawData = JSON.parse(content);
      
      const validationResult = backupSchema.safeParse(rawData);
      if (!validationResult.success) {
        console.error("[DataImport] Validation failed:", validationResult.error.flatten());
        toast.error("Invalid File", {
          description: "The selected file is not a valid Focus Forge backup.",
        });
        return;
      }
      
      const { todos, sessions, settings } = deserializeImportedData(validationResult.data);
      
      toastId = toast.loading("Importing data... This will overwrite all existing data.");

      // Use the new service methods to clear and bulk-import the data.
      await todoService.clearAndImportAll(todos);
      await focusSheetService.clearAndImportAll(sessions);

      // Update local settings from the backup
      useSettingsStore.getState().actions.setFocusDurationMinutes(settings.focusDurationMinutes);

      // The real-time listeners will automatically update the stores with the new data.
      // We don't need to call init() again.

      toast.success("Import Successful!", {
        id: toastId,
        description: "Your data has been restored from the backup.",
      });

    } catch (error) {
      console.error("[DataImport] Failed to import data:", error);
      toast.error("Import Failed", {
        id: toastId,
        description: "An error occurred while importing data.",
      });
    }
  },
};