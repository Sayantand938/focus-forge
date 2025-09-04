// src/features/focus-sheet/focus-sheet.store.ts
import { create } from "zustand";
import { toast } from "sonner";
import { focusSheetService } from "./focus-sheet.service";

export interface FocusSession {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  tag?: string;
  note?: string;
}

type UnsubscribeFn = () => void;
let unsubscribeFromSessions: UnsubscribeFn | null = null;

interface FocusSheetState {
  sessions: FocusSession[];
  actions: {
    init: () => void;
    clearData: () => void;
    addSession: (session: Omit<FocusSession, "id">) => Promise<void>;
    updateSession: (updatedSession: FocusSession) => Promise<void>;
    removeSession: (id: string) => Promise<void>;
  };
}

export const useFocusSheetStore = create<FocusSheetState>((set) => ({
  sessions: [],
  actions: {
    init: () => {
      if (unsubscribeFromSessions) {
        console.log("[FocusSheetStore] Listener already initialized.");
        return;
      }
      console.log("[FocusSheetStore] Initializing real-time listener...");
      
      unsubscribeFromSessions = focusSheetService.subscribeToSessions((sessions) => {
        console.log("[FocusSheetStore] Received updated sessions from Firestore:", sessions);
        set({ sessions });
      });
    },
    clearData: () => {
      console.log("[FocusSheetStore] Clearing data and unsubscribing from listener.");
      if (unsubscribeFromSessions) {
        unsubscribeFromSessions();
        unsubscribeFromSessions = null;
      }
      set({ sessions: [] });
    },
    addSession: async (newSession) => {
      try {
        await focusSheetService.add(newSession);
        toast.success("New focus session logged!");
      } catch (error) {
        console.error("Failed to add session:", error);
        toast.error("Failed to add session.");
      }
    },
    updateSession: async (updatedSession) => {
      try {
        await focusSheetService.update(updatedSession);
        toast.info("Session updated!");
      } catch (error) {
        console.error("Failed to update session:", error);
        toast.error("Failed to update session.");
      }
    },
    removeSession: async (id) => {
      try {
        await focusSheetService.remove(id);
        toast.error("Session removed.");
      } catch (error) {
        console.error("Failed to remove session:", error);
        toast.error("Failed to remove session.");
      }
    },
  },
}));