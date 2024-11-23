"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SearchTipTooltip() {
  const [isVisible, setIsVisible] = React.useState(true);
  const tooltipKey = "search-tip-seen";

  React.useEffect(() => {
    const hasSeenTip = localStorage.getItem(tooltipKey);
    if (hasSeenTip) setIsVisible(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(tooltipKey, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card className='relative w-full rounded-sm rounded-b-none border-blue-200 bg-blue-50 md:max-w-[320px] dark:border-blue-900 dark:bg-blue-950'>
      <Button
        variant='ghost'
        size='icon'
        className='absolute right-2 top-4 size-6 hover:bg-transparent'
        onClick={handleDismiss}
      >
        <X />
      </Button>
      <CardHeader className='p-4'>
        <CardTitle className='text-sm font-medium'>
          Pro Tip: Category Search
        </CardTitle>
        <CardDescription className='text-xs'>
          You can search by category names to see all items in that category!
          Try typing{" "}
          <span className='font-medium text-foreground'>
            &quot;Weapons&quot;
          </span>{" "}
          or{" "}
          <span className='font-medium text-foreground'>
            &quot;Construction&quot;
          </span>{" "}
          in the search box.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
