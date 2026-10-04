import Link from "next/link";

import type { PublicFilterListDTO } from "@/types/filter";
import { CardDescription } from "@/components/ui/card";
import { UserBadge } from "@/components/shared/user-badge";

export function FilterCardMeta({ filter }: { filter: PublicFilterListDTO }) {
  if (!filter.author) return null;

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <CardDescription className='flex min-w-0 items-center gap-x-2 truncate'>
        Created by{" "}
        {filter.creatorUsername ? (
          <Link
            href={`/users/${encodeURIComponent(filter.creatorUsername)}`}
            className='truncate font-bold hover:underline'
          >
            {filter.author}
          </Link>
        ) : (
          <span className='truncate font-bold'>{filter.author}</span>
        )}
      </CardDescription>
      <div className='flex flex-wrap gap-1.5'>
        {filter.badges?.map((badge) => (
          <UserBadge key={badge} type={badge} />
        ))}
      </div>
    </div>
  );
}
