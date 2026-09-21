"use client";

import { useState, type ComponentProps } from "react";
import { trackEvent } from "@/utils/rybbit";
import { useUser } from "@clerk/nextjs";
import { type VariantProps } from "class-variance-authority";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DonateAlert } from "@/components/features/donation/donate-alert";

interface DonateButtonProps
  extends ComponentProps<"a">,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  href: string;
  platform: "kofi" | "buyMeACoffee" | "patreon";
}

const platformNames = {
  kofi: "Ko-fi",
  buyMeACoffee: "Buy Me A Coffee",
  patreon: "Patreon",
} as const;

export function DonateButton({
  icon,
  href,
  children,
  platform,
  className,
  variant,
  size,
  ...props
}: DonateButtonProps) {
  const { user } = useUser();
  const [showAlert, setShowAlert] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    trackEvent("donate_button_clicked", { platform });
    if (!user) {
      const REDIRECT_DELAY = 3000;
      const toastId = toast.info("You must be signed in to donate", {
        description: "Redirecting in 3s...",
        duration: REDIRECT_DELAY,
        richColors: true,
      });

      let secondsLeft = 3;
      const interval = setInterval(() => {
        secondsLeft -= 1;
        toast.info("You must be signed in to donate", {
          id: toastId,
          description: `Redirecting in ${secondsLeft}s...`,
          duration: 1000,
          richColors: true,
        });
      }, 1000);

      setTimeout(async () => {
        clearInterval(interval);
        window.location.href = "/auth/sign-in";
      }, REDIRECT_DELAY);
      return;
    }

    setShowAlert(true);
  };

  const handleDonate = () => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const getUserEmailString = () => {
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (!userEmail) return "the same email you used to sign up";
    return userEmail;
  };

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className='[&_svg]:size-5'>{icon}</span>}
        {children}
      </a>

      <DonateAlert
        isOpen={showAlert}
        onOpenChange={setShowAlert}
        email={getUserEmailString()}
        platform={platformNames[platform]}
        onConfirm={handleDonate}
      />
    </>
  );
}
