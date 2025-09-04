// src/features/settings/components/reset-data.tsx
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

import { useAuthStore } from "@/features/auth/auth.store";
import { useSettingsStore } from "../settings.store";
import { userService } from "@/features/auth/user.service";

export function ResetData() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { logout } = useAuthStore((state) => state.actions);
  const { reset: resetSettings } = useSettingsStore((state) => state.actions);

  const handleReset = async () => {
    const toastId = toast.loading("Resetting all application data...");
    
    // Close the dialog immediately
    setIsAlertOpen(false);

    try {
      // 1. Delete all user data from Firestore
      await userService.deleteAllUserData();

      // 2. Reset local settings (in localStorage) to their initial state
      resetSettings();
      
      // 3. Show the final success message and log out
      toast.success("Application Reset Complete", {
        id: toastId,
        description: "Your data has been erased. Signing you out...",
      });
      
      // 4. Logout (which will clear data stores and redirect to login)
      await logout();

    } catch (error) {
      console.error("Failed to reset data:", error);
      toast.error("Reset Failed", { 
        id: toastId,
        description: "An error occurred while deleting your data. Please try again."
      });
    }
  };

  return (
    <Card className="p-0 border-destructive">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6">
        <div className="space-y-1 mb-4 md:mb-0">
          <CardTitle className="text-destructive">Reset Application Data</CardTitle>
          <CardDescription>
            Permanently delete all of your tasks and focus sessions from the cloud. This action is irreversible.
          </CardDescription>
        </div>
        
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Reset Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your cloud data (todos and focus sessions) and sign you out. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}