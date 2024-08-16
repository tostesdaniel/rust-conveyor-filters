import { Suspense } from "react";
import { kv } from "@vercel/kv";
import { Loader2, StarIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RepoStarsButton {
  className?: string;
}

async function StargazersCount() {
  const stars = await kv.get<number>("repo-stars");
  if (!stars) {
    return <>N/A</>;
  }
  return <>{stars}</>;
}

export async function RepoStarsButton({
  className,
  ...props
}: RepoStarsButton) {
  return (
    <Button
      size='sm'
      variant='outline'
      className={cn("group gap-x-2 hover:bg-secondary/50", className)}
      asChild
      {...props}
    >
      <a href={siteConfig.links.repo} target='_blank' rel='noopener noreferrer'>
        <StarIcon className='h-4 w-4 group-hover:text-[#daaa3f]' />
        Stars
        <Suspense
          fallback={
            <Badge variant='secondary' className='px-1.5'>
              <Loader2 className='h-4 w-2.5 animate-spin' />
            </Badge>
          }
        >
          <Badge variant='secondary' className='px-1.5 tabular-nums'>
            <StargazersCount />
          </Badge>
        </Suspense>
      </a>
    </Button>
  );
}
