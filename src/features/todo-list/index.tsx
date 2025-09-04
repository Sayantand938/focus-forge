// File: src/features/todo-list/index.tsx
import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";

import { useTodoStore, type Status } from "./todo.store";
import { columns } from "./components/columns";
import { AddTodoSheet } from "./components/add-todo-sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DataTable } from "@/shared/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export function TodoListFeature() {
  const todos = useTodoStore((state) => state.todos);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const matchesSearch =
        searchValue === "" ||
        todo.task.toLowerCase().includes(searchValue.toLowerCase()) ||
        (todo.tag && todo.tag.toLowerCase().includes(searchValue.toLowerCase()));
      
      const matchesStatus = statusFilter === "All" || todo.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [todos, searchValue, statusFilter]);

  return (
    <main className="flex-1 bg-background text-foreground py-12 px-4 md:px-8 space-y-8">
      <AddTodoSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todo List</h1>
          <p className="text-lg text-muted-foreground mt-1">Manage your tasks and stay productive.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks by description or tag..."
              className="pl-10 bg-card border-border shadow-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(value) => setStatusFilter(value as Status | "All")} value={statusFilter}>
              <SelectTrigger className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
              Add New Task
            </Button>
          </div>
        </div>

        {filteredTodos.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredTodos}
            filterValue={searchValue}
            filterColumn="task"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-lg text-center p-4">
            <p className="text-xl font-semibold text-foreground">No tasks found.</p>
            <p className="text-muted-foreground mt-2">
              {searchValue || statusFilter !== "All" ? "Try a different search or filter." : "You're all caught up! ✨"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}