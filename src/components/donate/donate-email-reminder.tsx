"use client";

import { useUser } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function DonateEmailReminder() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!email) return null;

  return (
    <Alert>
      <AlertCircle className='h-4 w-4' />
      <AlertDescription>
        <p>
          Please use{" "}
          <span className='rounded-md bg-muted px-1.5 py-0.5 font-mono font-medium'>
            {email}
          </span>{" "}
          when making your donation to receive your badge automatically.
        </p>
      </AlertDescription>
    </Alert>
  );
}
