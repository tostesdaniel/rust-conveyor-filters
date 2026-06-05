import Link from "next/link";
import { GitForkIcon } from "lucide-react";

import type { ForkAttributionDTO } from "@/types/filter";
import { CardDescription } from "@/components/ui/card";

export function FilterAttribution({
  forkedFrom,
}: {
  forkedFrom: ForkAttributionDTO;
}) {
  return (
    <CardDescription className='flex min-w-0 items-center gap-1.5 truncate'>
      <GitForkIcon
        aria-hidden='true'
        className='size-3.5 shrink-0 text-muted-foreground/75'
      />
      <span className='truncate'>
        Remixed from{" "}
        <span className='font-semibold text-foreground/90'>
          {forkedFrom.name}
        </span>
        {forkedFrom.author ? (
          <>
            {" "}
            by{" "}
            {forkedFrom.creatorUsername ? (
              <Link
                href={`/users/${encodeURIComponent(forkedFrom.creatorUsername)}`}
                className='font-semibold hover:underline'
              >
                {forkedFrom.author}
              </Link>
            ) : (
              <span className='font-semibold'>{forkedFrom.author}</span>
            )}
          </>
        ) : null}
      </span>
    </CardDescription>
  );
}
