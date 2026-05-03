"use client";

import { api } from "@/trpc/react";

import { cn } from "@/lib/utils";
import {
  CreatorProfileHero,
  LANDING_GLOW_SHADOW,
  LANDING_GLOW_SHADOW_DARK,
  LANDING_GRADIENT_FRAME,
  LANDING_GRADIENT_FRAME_DARK,
} from "@/components/features/creator-profile/creator-profile-hero";
import { CreatorPublicFilters } from "@/components/features/creator-profile/creator-public-filters";
import { Typography } from "@/components/shared/typography";

function CreatorProfileSkeleton() {
  return (
    <div className='animate-pulse py-6 sm:py-8'>
      <div
        className={cn(
          "rounded-2xl p-px",
          LANDING_GRADIENT_FRAME,
          LANDING_GRADIENT_FRAME_DARK,
          LANDING_GLOW_SHADOW,
          LANDING_GLOW_SHADOW_DARK,
        )}
      >
        <div className='overflow-hidden rounded-[calc(1rem-1px)] border border-border/80 bg-card dark:bg-card/90'>
          <div className='p-6 sm:p-8'>
            <div className='flex flex-col gap-8 lg:flex-row lg:gap-12'>
              <div className='flex shrink-0 justify-center lg:block'>
                <div className='size-27 rounded-full bg-muted lg:size-31' />
              </div>
              <div className='min-w-0 flex-1 space-y-4'>
                <div className='mx-auto h-10 max-w-xs rounded-md bg-muted lg:mx-0' />
                <div className='mx-auto h-4 w-48 rounded-md bg-muted lg:mx-0' />
                <div className='rounded-xl border border-border/70 bg-muted/80 p-4 dark:bg-muted/40'>
                  <div className='h-4 max-w-full rounded-md bg-muted' />
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <div className='h-8 w-24 rounded-full bg-muted' />
                    <div className='h-8 w-28 rounded-full bg-muted' />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='grid border-t border-border bg-muted/25 sm:grid-cols-2 dark:bg-muted/10'>
            <div className='space-y-3 border-b border-border px-6 py-5 sm:border-r sm:border-b-0'>
              <div className='h-3 w-12 rounded-md bg-muted' />
              <div className='flex flex-wrap gap-6'>
                <div className='h-10 w-16 rounded-md bg-muted' />
                <div className='h-10 w-16 rounded-md bg-muted' />
              </div>
            </div>
            <div className='space-y-3 px-6 py-5'>
              <div className='h-3 w-24 rounded-md bg-muted' />
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='h-14 rounded-md bg-muted' />
                <div className='h-14 rounded-md bg-muted' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreatorProfileView({ username }: { username: string }) {
  const { data, isPending, isError, error } =
    api.creator.getPublicProfile.useQuery({ username });

  if (isPending) {
    return <CreatorProfileSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className='rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-6 sm:px-5'>
        <Typography variant='h4' className='text-destructive'>
          Something went wrong
        </Typography>
        <Typography variant='p' className='mt-2 text-muted-foreground'>
          {error?.message ?? "Could not load this profile."}
        </Typography>
      </div>
    );
  }

  const joinLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(data.createdAt);

  return (
    <div className='space-y-10 py-6 sm:space-y-12 sm:py-8'>
      <CreatorProfileHero
        displayName={data.displayName}
        username={data.username}
        imageUrl={data.imageUrl}
        joinLabel={joinLabel}
        badges={data.badges}
        hierarchy={data.hierarchy}
        publicFilterCount={data.stats.publicFilterCount}
        bookmarkCount={data.stats.bookmarkCount}
        totalExports={data.stats.totalExports}
        totalViews={data.stats.totalViews}
      />
      <CreatorPublicFilters hierarchy={data.hierarchy} />
    </div>
  );
}
