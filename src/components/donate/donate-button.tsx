"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { DonateAlert } from "@/components/donate/donate-alert";

interface DonateButtonProps extends ButtonProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  href: string;
  platform: "kofi" | "buyMeACoffee";
}

const platformNames = {
  kofi: "Ko-fi",
  buyMeACoffee: "Buy Me A Coffee",
} as const;

export function DonateButton({
  icon,
  href,
  children,
  platform,
  ...props
}: DonateButtonProps) {
  const { user } = useUser();
  const [showAlert, setShowAlert] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
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
          richColors: false,
        });
      }, 1000);

      setTimeout(async () => {
        clearInterval(interval);
        window.location.href = "/sign-in";
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
      <Button asChild {...props}>
        <a href={href} onClick={handleClick}>
          {icon && <span className='[&_svg]:size-5'>{icon}</span>}
          {children}
        </a>
      </Button>

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
