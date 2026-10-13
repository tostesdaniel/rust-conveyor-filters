"use client";

import * as React from "react";
import Link from "next/link";
import type { CreateFilterInput } from "@/schemas/filterFormSchema";
import {
  isExpired,
  useFormDraftStore,
  type FormDraft,
} from "@/stores/form-drafts";
import { useAuth } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { FilePenLineIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useGetUserFilters } from "@/hooks/use-get-user-filters";
import {
  filterDraftHref,
  parseFilterDraftKey,
  type FilterDraftTarget,
} from "@/lib/utils/filter-draft";
import { Button, buttonVariants } from "@/components/ui/button";
import { ItemIcon } from "@/components/shared/item-icon";

interface DraftEntry {
  key: string;
  draft: FormDraft<CreateFilterInput>;
  target: FilterDraftTarget;
  title: string;
  label: string;
}

function discardDraft(key: string, draft: FormDraft) {
  useFormDraftStore.getState().removeDraft(key);
  toast("Draft discarded", {
    duration: 8000,
    action: {
      label: "Undo",
      onClick: () =>
        useFormDraftStore.setState((state) => ({
          drafts: { ...state.drafts, [key]: draft },
        })),
    },
  });
}

export function ContinueEditing() {
  const { userId } = useAuth();
  const drafts = useFormDraftStore((state) => state.drafts);
  const { data: filters } = useGetUserFilters();
  // Drafts live in localStorage, so render nothing until after hydration.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!userId || !filters) return;
    const ids = new Set(filters.map((filter) => filter.id));
    const { drafts, removeDraft } = useFormDraftStore.getState();
    for (const key of Object.keys(drafts)) {
      const target = parseFilterDraftKey(key, userId);
      if (target?.kind === "edit" && !ids.has(target.filterId)) {
        removeDraft(key);
      }
    }
  }, [filters, userId]);

  const entries = React.useMemo(() => {
    if (!userId) return [];
    const nameById = new Map(
      filters?.map((filter) => [filter.id, filter.name]),
    );
    return Object.entries(drafts)
      .flatMap(([key, stored]): DraftEntry[] => {
        const target = parseFilterDraftKey(key, userId);
        if (!target || isExpired(stored)) return [];
        const draft = stored as FormDraft<CreateFilterInput>;
        const draftName = draft.values.name?.trim() || "Untitled filter";
        if (target.kind === "edit") {
          const name = nameById.get(target.filterId);
          if (!name) return [];
          return [
            { key, draft, target, title: name, label: "Unsaved changes" },
          ];
        }
        const label = target.kind === "remix" ? "Remix" : "New filter";
        return [{ key, draft, target, title: draftName, label }];
      })
      .sort((a, b) => b.draft.savedAt - a.draft.savedAt);
  }, [drafts, filters, userId]);

  if (!mounted || entries.length === 0) return null;

  return (
    <section className='mt-6'>
      <h2 className='text-sm font-medium text-muted-foreground'>
        Continue where you left off
      </h2>
      <ul className='mt-2 divide-y rounded-md border border-border'>
        {entries.map(({ key, draft, target, title, label }) => (
          <li key={key} className='flex items-center gap-3 px-4 py-3'>
            <div className='relative flex size-8 shrink-0 items-center justify-center'>
              {draft.values.imagePath ? (
                <ItemIcon
                  imagePath={draft.values.imagePath}
                  size='tiny'
                  alt=''
                  height={32}
                  width={32}
                  unoptimized
                  className='object-contain'
                />
              ) : (
                <FilePenLineIcon
                  className='size-5 text-muted-foreground'
                  aria-hidden
                />
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{title}</p>
              <p className='truncate text-sm text-muted-foreground'>
                {label} ·{" "}
                {formatDistanceToNow(draft.savedAt, { addSuffix: true })}
              </p>
            </div>
            <Link
              href={filterDraftHref(target)}
              className={buttonVariants({ size: "sm" })}
            >
              Continue
            </Link>
            <Button
              type='button'
              size='icon-sm'
              variant='ghost'
              aria-label={`Discard draft for ${title}`}
              onClick={() => discardDraft(key, draft)}
            >
              <XIcon />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
