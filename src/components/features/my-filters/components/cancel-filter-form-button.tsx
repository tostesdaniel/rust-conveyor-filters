"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Only render while the form has changes; it always asks before leaving. */
export function CancelFilterFormButton({
  disabled,
  onLeave,
}: {
  disabled?: boolean;
  onLeave: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type='button'
        variant='ghost'
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Cancel
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your unsaved changes to this filter will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant='ghost'>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                setOpen(false);
                onLeave();
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
