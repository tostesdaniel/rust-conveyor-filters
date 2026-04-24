"use client";

import { api } from "@/trpc/react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Owner-only button that asks the AI to categorize this filter and surfaces
 * the resulting tags inline (3 per user per day).
 */
export function SuggestTagsButton({ filterId }: { filterId: number }) {
  const utils = api.useUtils();

  const mutation = api.tag.requestSuggestion.useMutation({
    onSuccess: async (data) => {
      toast.success("Tags suggested", {
        description: data.tags.length
          ? data.tags.map((t) => t.label).join(", ")
          : "No tags could be inferred.",
      });
      await utils.filter.getById.invalidate({ filterId });
      await utils.filter.getPublicListInfinite.invalidate();
    },
    onError: (err) => {
      toast.error("Could not suggest tags", {
        description: err.message,
      });
    },
  });

  return (
    <div className='flex flex-col gap-2'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ filterId })}
      >
        <Sparkles />
        {mutation.isPending ? "Thinking..." : "Suggest tags"}
      </Button>
      {mutation.data?.tags.length ? (
        <div className='flex flex-wrap gap-1'>
          {mutation.data.tags.map((t) => (
            <Badge key={t.slug} variant='secondary'>
              {t.label}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
