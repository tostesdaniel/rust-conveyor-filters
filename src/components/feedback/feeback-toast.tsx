"use client";

import { setTimeout } from "timers";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export function SignInToast() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const shouldShowToast = () => {
      return isLoaded && !isSignedIn && !hasShownToast.current;
    };

    if (shouldShowToast()) {
      hasShownToast.current = true;
      setTimeout(() => {
        toast.warning("Hey there! 👋 You're not signed in.", {
          description: "Please sign in to share your feedback.",
          action: {
            label: "Sign in",
            onClick: () => router.push("/auth/sign-in"),
          },
          position: "top-center",
        });
      });
    }
  }, [isLoaded, isSignedIn, router]);

  return null;
}
