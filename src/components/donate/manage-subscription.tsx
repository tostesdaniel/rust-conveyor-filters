"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";

import type { Subscription } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ManageSubscriptionProps = {
  subscription: Subscription;
};

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function ManageSubscription({ subscription }: ManageSubscriptionProps) {
  const utils = api.useUtils();

  const cancel = api.billing.cancelSubscription.useMutation({
    onSuccess: async () => {
      toast.success("Subscription canceled");
      await utils.billing.getMySubscription.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const scheduleSwitch = api.billing.scheduleIntervalSwitch.useMutation({
    onSuccess: async () => {
      toast.success("Plan switch scheduled for the end of the current period");
      await utils.billing.getMySubscription.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const target = subscription.interval === "monthly" ? "yearly" : "monthly";
  const switchPending = subscription.pendingSwitch !== null;
  const isCanceled = subscription.status === "canceled";

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>
            {isCanceled ? "Subscription canceled" : "Active subscription"}
          </CardTitle>
          <Badge
            variant={isCanceled ? "outline" : "secondary"}
            className='capitalize'
          >
            {subscription.interval}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-2 text-sm'>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground'>
            {isCanceled ? "Access ends on" : "Current period ends"}
          </span>
          <span>{formatDate(subscription.currentPeriodEnd)}</span>
        </div>
        {switchPending && !isCanceled ? (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Pending switch</span>
            <span className='capitalize'>{subscription.pendingSwitch}</span>
          </div>
        ) : null}
        {isCanceled ? (
          <p className='text-muted-foreground'>
            Your supporter benefits stay active until the end of the current
            period.
          </p>
        ) : null}
      </CardContent>
      {isCanceled ? null : (
        <CardFooter className='flex flex-col gap-2 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            className='w-full sm:w-auto'
            onClick={() => scheduleSwitch.mutate({ target })}
            disabled={scheduleSwitch.isPending || switchPending}
          >
            Switch to {target}
          </Button>
          <Button
            type='button'
            variant='destructive'
            className='w-full sm:ml-auto sm:w-auto'
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
          >
            Cancel subscription
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
