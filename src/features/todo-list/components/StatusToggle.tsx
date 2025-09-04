// File: src/features/todo-list/components/StatusToggle.tsx
import { Switch } from "@/shared/ui/switch";
import { toast } from "sonner";
import { useTodoStore } from "../todo.store";

interface StatusToggleProps {
  id: string;
  currentStatus: "Pending" | "In Progress" | "Completed";
}

export function StatusToggle({ id, currentStatus }: StatusToggleProps) {
  const setTodoStatus = useTodoStore((state) => state.actions.setTodoStatus);

  const handleToggle = (checked: boolean) => {
    const newStatus = checked ? "Completed" : "Pending";
    console.log(`[StatusToggle] Toggling status for todo ID ${id} to ${newStatus}`);
    setTodoStatus(id, newStatus);
    if (newStatus === "Completed") {
      toast.success("Task marked as complete!");
    } else {
      toast.info("Task marked as pending.");
    }
  };

  return (
    <Switch
      checked={currentStatus === "Completed"}
      onCheckedChange={handleToggle}
    />
  );
}