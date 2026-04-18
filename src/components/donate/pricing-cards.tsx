"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutButton } from "@/components/donate/checkout-button";
import { ManageSubscription } from "@/components/donate/manage-subscription";

// import { CheckoutButton } from "./checkout-button";
// import { ManageSubscription } from "./manage-subscription";

type Plan = {
  interval: "monthly" | "yearly";
  title: string;
  price: string;
  cadence: string;
  perks: string[];
  highlight?: string;
};

const plans: Plan[] = [
  {
    interval: "monthly",
    title: "Monthly Supporter",
    price: "$3",
    cadence: "per month",
    perks: [
      "Ad-free browsing",
      "Supporter badge on your profile",
      "Cancel anytime",
    ],
  },
  {
    interval: "yearly",
    title: "Yearly Supporter",
    price: "$30",
    cadence: "per year",
    highlight: "Save ~17%",
    perks: [
      "Everything in Monthly",
      "Two months free vs monthly",
      "Support a full year of development",
    ],
  },
];

export function PricingCards() {
  const [activeInterval, setActiveInterval] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const { data: subscription, isLoading } =
    api.billing.getMySubscription.useQuery();

  if (isLoading) {
    return (
      <div className='grid w-full gap-4 sm:grid-cols-2'>
        <Skeleton className='h-64 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (subscription) {
    return <ManageSubscription subscription={subscription} />;
  }

  return (
    <div className='flex w-full flex-col gap-6'>
      <div className='mx-auto inline-flex rounded-full border bg-muted p-1 text-sm'>
        {(["monthly", "yearly"] as const).map((interval) => (
          <button
            key={interval}
            type='button'
            onClick={() => setActiveInterval(interval)}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium capitalize transition-colors",
              activeInterval === interval
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {interval}
          </button>
        ))}
      </div>

      <div className='grid w-full gap-4 sm:grid-cols-2'>
        {plans.map((plan) => {
          const isActive = plan.interval === activeInterval;
          return (
            <Card
              key={plan.interval}
              className={cn(
                "flex flex-col transition-all",
                isActive ? "border-primary shadow-md" : "opacity-80",
              )}
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle>{plan.title}</CardTitle>
                  {plan.highlight ? (
                    <Badge variant='secondary'>{plan.highlight}</Badge>
                  ) : null}
                </div>
                <CardDescription>
                  <span className='text-3xl font-semibold text-foreground'>
                    {plan.price}
                  </span>{" "}
                  <span className='text-muted-foreground'>{plan.cadence}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1'>
                <ul className='space-y-2 text-sm'>
                  {plan.perks.map((perk) => (
                    <li key={perk} className='flex items-start gap-2'>
                      <span aria-hidden className='mt-1 text-primary'>
                        •
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <CheckoutButton
                  interval={plan.interval}
                  className='w-full'
                  onBeforeCheckout={() => setActiveInterval(plan.interval)}
                >
                  Subscribe {plan.interval}
                </CheckoutButton>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
