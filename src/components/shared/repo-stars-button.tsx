import React, { Suspense } from "react";
import { StarIcon } from "lucide-react";
import millify from "millify";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/shared/icons";

interface RepoStarsButton {
  className?: string;
}

async function StargazersCount({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const data = await fetch(
    "https://api.github.com/repos/tostesdaniel/rust-conveyor-filters",
    { next: { revalidate: 86400 } }, // 1 day
  );
  const json = await data.json();
  const stars = json.stargazers_count;

  return (
    <span
      className={cn("text-xs text-muted-foreground tabular-nums", className)}
      aria-label={stars ? `${stars} GitHub stars` : "Star count unavailable"}
      {...props}
    >
      <span aria-hidden='true'>
        {stars ? millify(stars, { lowercase: true }) : "N/A"}
      </span>
    </span>
  );
}

export async function RepoStarsButton({
  className,
  ...props
}: RepoStarsButton) {
  return (
    <Button
      size='sm'
      variant='ghost'
      className={cn("group h-9 hover:bg-secondary/50", className)}
      asChild
      {...props}
    >
      <a
        href={siteConfig.links.repo}
        target='_blank'
        rel='noopener noreferrer'
        aria-label='View project on GitHub and see star count'
      >
        <Icons.gitHub aria-hidden='true' />
        <span className='sr-only'>GitHub repository with</span>
        <Suspense fallback={<Skeleton className='h-4 w-10' />}>
          <StargazersCount />
          <StarIcon
            className='-ml-0.5 size-3.5 text-muted-foreground group-hover:text-[#daaa3f]'
            aria-hidden='true'
          />
        </Suspense>
        <span className='sr-only'>stars</span>
      </a>
    </Button>
  );
}
