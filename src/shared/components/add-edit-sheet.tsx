// src/shared/components/add-edit-sheet.tsx
import { ReactNode } from "react";
import { FieldValues, UseFormReturn, FormProvider } from "react-hook-form";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/shared/ui/sheet";
import { Button } from "@/shared/ui/button";

// Use an object type for the props to make them more readable
type AddEditSheetProps<T extends FieldValues> = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  form: UseFormReturn<T>;
  onSubmit: (values: T) => void;
  isEditing: boolean;
  title: string;
  description: string;
  children: ReactNode;
};

// Use a single generic type 'T' that extends FieldValues for the component
// The type for the 'form' and 'onSubmit' props is now correct.
export function AddEditSheet<T extends FieldValues>({
  isOpen,
  onOpenChange,
  form,
  onSubmit,
  isEditing,
  title,
  description,
  children,
}: AddEditSheetProps<T>) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border text-foreground w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 space-y-6">
              {children}
            </div>

            <SheetFooter className="mt-auto border-t border-border px-4 py-6">
              <SheetClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit">
                {isEditing ? "Save Changes" : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}