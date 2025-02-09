import { ArchiveX } from "lucide-react";

import { ShareTokenDisplay } from "./share-token-display";

export function SharedFiltersEmptyState() {
  return (
    <div className='mt-6 text-center'>
      <ArchiveX className='mx-auto h-12 w-12' />
      <h3 className='mt-2 text-sm font-semibold'>No filters shared with you</h3>
      <p className='mx-auto mt-1 max-w-lg text-sm text-balance text-muted-foreground'>
        Welcome to filter sharing! This tab is where you&apos;ll see filters
        that others have shared with you. To start receiving filters,
        you&apos;ll need to share your personal token with friends who want to
        share their filters with you.
      </p>
      <ol className='mx-auto my-6 flex max-w-sm list-inside list-decimal flex-col items-start gap-y-2 text-sm text-muted-foreground'>
        <li>Copy your personal token below</li>
        <li>Share it with a friend</li>
        <li>Ask them to use it when sharing their filters with you</li>
      </ol>
      <div className='mx-auto mt-4 flex max-w-sm flex-col items-start gap-y-2'>
        <p className='text-sm font-medium'>Your personal token:</p>
        <ShareTokenDisplay />
      </div>
    </div>
  );
}
