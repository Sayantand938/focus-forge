// src/features/todo-list/todo.store.ts
import { create } from "zustand";
import { toast } from "sonner";
import { todoService } from "./todo.service";

export type Priority = "None" | "Low" | "Medium" | "High";
export type Status = "Pending" | "In Progress" | "Completed";

export interface Todo {
  id: string;
  task: string;
  tag?: string;
  priority: Priority;
  dueDate?: Date;
  createdAt: Date;
  status: Status;
}

// Function to unsubscribe from the Firestore listener
type UnsubscribeFn = () => void;
let unsubscribeFromTodos: UnsubscribeFn | null = null;

interface TodoState {
  todos: Todo[];
  actions: {
    // This now starts the listener
    init: () => void;
    // This is now used on logout to stop the listener
    clearData: () => void;
    addTodo: (todo: Omit<Todo, "id" | "createdAt" | "status">) => Promise<void>;
    removeTodo: (id: string) => Promise<void>;
    updateTodo: (updatedTodo: Todo) => Promise<void>;
    setTodoStatus: (id: string, status: Status) => Promise<void>;
  };
}

export const useTodoStore = create<TodoState>((set) => ({ // REMOVED get from here
  todos: [],
  actions: {
    init: () => {
      // Prevent setting up multiple listeners
      if (unsubscribeFromTodos) {
        console.log("[TodoStore] Listener already initialized.");
        return;
      }
      console.log("[TodoStore] Initializing real-time listener...");
      
      unsubscribeFromTodos = todoService.subscribeToTodos((todos) => {
        console.log("[TodoStore] Received updated todos from Firestore:", todos);
        set({ todos });
      });
    },
    clearData: () => {
      console.log("[TodoStore] Clearing data and unsubscribing from listener.");
      if (unsubscribeFromTodos) {
        unsubscribeFromTodos();
        unsubscribeFromTodos = null;
      }
      set({ todos: [] });
    },
    addTodo: async (newTodo) => {
      try {
        await todoService.add(newTodo);
        toast.success("New todo added!");
      } catch (error) {
        console.error("Failed to add todo:", error);
        toast.error("Failed to add todo.");
      }
    },
    removeTodo: async (id) => {
      try {
        await todoService.remove(id);
        toast.error("Todo removed.");
      } catch (error) {
        console.error("Failed to remove todo:", error);
        toast.error("Failed to remove todo.");
      }
    },
    updateTodo: async (updatedTodo) => {
      try {
        await todoService.update(updatedTodo);
        toast.info("Task updated!");
      } catch (error) {
        console.error("Failed to update todo:", error);
        toast.error("Failed to update task.");
      }
    },
    setTodoStatus: async (id, status) => {
      try {
        await todoService.setStatus(id, status);
      } catch (error) {
        console.error("Failed to set todo status:", error);
        toast.error("Failed to update status.");
      }
    },
  },
}));