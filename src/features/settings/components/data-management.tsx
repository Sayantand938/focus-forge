// src/features/settings/components/data-management.tsx
import { useState } from "react";
import { Import, Upload } from "lucide-react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/shared/ui/card";
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
import { dataManagementService } from "@/shared/lib/data-management.service";

export function DataManagement() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const handleImport = async () => {
    // We can call the service directly. It will show its own toasts.
    await dataManagementService.importData();
    setIsAlertOpen(false);
  };

  const handleExport = async () => {
    await dataManagementService.exportData();
  };

  return (
    <Card className="p-0">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6">
        <div className="space-y-1 mb-4 md:mb-0">
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export your data to a JSON file or import a previous backup.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Import className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Importing data will overwrite all of your existing tasks and focus sessions in the cloud. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleImport}>
                  Yes, Overwrite and Import
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleExport}>
            <Upload className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
    </Card>
  );
}