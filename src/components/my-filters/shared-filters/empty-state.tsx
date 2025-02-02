import { ArchiveX } from "lucide-react";

import { ShareTokenDisplay } from "./share-token-display";

export function SharedFiltersEmptyState() {
  return (
    <div className='mt-6 text-center'>
      <ArchiveX className='mx-auto h-12 w-12' />
      <h3 className='mt-2 text-sm font-semibold'>No filters shared with you</h3>
      <p className='mt-1 text-sm'>
        Send this token to a friend that wants to share a filter with you
      </p>
      <div className='mt-4 flex flex-col items-center gap-y-2'>
        <ShareTokenDisplay />
      </div>
    </div>
  );
}
