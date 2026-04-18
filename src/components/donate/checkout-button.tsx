"use client";

import { useRef, useState } from "react";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type CheckoutButtonProps = {
  interval: "monthly" | "yearly";
  className?: string;
  children: React.ReactNode;
  onBeforeCheckout?: () => void;
};

export function CheckoutButton({
  interval,
  className,
  children,
  onBeforeCheckout,
}: CheckoutButtonProps) {
  const utils = api.useUtils();
  const [isOpening, setIsOpening] = useState(false);
  const listenersBound = useRef(false);

  const createCheckout = api.billing.createCheckout.useMutation({
    onSuccess: async ({ token, url }) => {
      try {
        const { default: PayNowJS } = await import("@paynow-gg/paynow.js");

        if (!listenersBound.current) {
          PayNowJS.checkout.on("ready", () => setIsOpening(false));
          PayNowJS.checkout.on("completed", async () => {
            toast.success("Thanks for supporting the site!");
            await utils.billing.getMySubscription.invalidate();
            PayNowJS.checkout.close();
          });
          PayNowJS.checkout.on("closed", async () => {
            setIsOpening(false);
            await utils.billing.getMySubscription.invalidate();
          });
          listenersBound.current = true;
        }

        PayNowJS.checkout.open({ token });
      } catch (error) {
        console.error("Failed to open PayNow overlay, falling back", error);
        window.location.href = url;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Could not start checkout");
      setIsOpening(false);
    },
  });

  const handleClick = () => {
    onBeforeCheckout?.();
    setIsOpening(true);
    createCheckout.mutate({ interval });
  };

  const loading = isOpening || createCheckout.isPending;

  return (
    <Button
      type='button'
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
      {children}
    </Button>
  );
}
