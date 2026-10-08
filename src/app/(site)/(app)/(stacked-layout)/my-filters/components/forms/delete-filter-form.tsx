"use client";

import { Dispatch, SetStateAction } from "react";
import { api } from "@/trpc/react";
import { trackEvent } from "@/utils/rybbit";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { removeFilter } from "@/components/features/my-filters/hierarchy-cache";
import { useHierarchyCache } from "@/components/features/my-filters/hooks/use-hierarchy-cache";

type DeleteFilterFormProps = {
  cardId: number;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const formSchema = z.object({
  cardId: z.number(),
});

export function DeleteFilterForm({ cardId, setOpen }: DeleteFilterFormProps) {
  const utils = api.useUtils();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardId,
    },
  });

  const hierarchyCache = useHierarchyCache();
  const mutation = api.filter.delete.useMutation({
    onMutate: ({ filterId }) =>
      hierarchyCache.update((data) => removeFilter(data, filterId)),
    onSuccess: () => {
      trackEvent("filter_deleted", { filterId: cardId });
      toast.success("Filter deleted successfully");
    },
    onError: (_err, _variables, previous) => {
      hierarchyCache.rollback(previous);
      toast.error("Error deleting filter");
    },
    onSettled: () =>
      Promise.all([
        hierarchyCache.refetch(),
        utils.filter.getAll.invalidate(),
        utils.filter.getPublicListInfinite.invalidate(),
        utils.bookmark.getAll.invalidate(),
      ]),
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate({ filterId: data.cardId });
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)} variant='ghost'>
            Cancel
          </AlertDialogCancel>
          <Button type='submit' variant='destructive'>
            Delete
          </Button>
        </AlertDialogFooter>
      </form>
    </Form>
  );
}
