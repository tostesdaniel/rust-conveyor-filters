"use client";

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

interface DonateAlertProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  platform: string;
  onConfirm: () => void;
}

export function DonateAlert({
  isOpen,
  onOpenChange,
  email,
  platform,
  onConfirm,
}: DonateAlertProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Important: Use your registered email
          </AlertDialogTitle>
          <AlertDialogDescription className='space-y-2'>
            <p>
              Please use{" "}
              <span className='rounded-md bg-muted px-1.5 py-0.5 font-mono font-medium'>
                {email}
              </span>{" "}
              when donating through{" "}
              <span className='font-semibold'>{platform}</span> to receive your
              donor badge.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Continue to {platform}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
