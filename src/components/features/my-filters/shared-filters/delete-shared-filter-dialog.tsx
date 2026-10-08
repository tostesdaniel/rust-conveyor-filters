"use client";

import { api, type RouterOutputs } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

interface DeleteSharedFilterDialogProps {
  filterId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  filterId: z.number(),
});

type SharedFilterGroups = RouterOutputs["sharedFilter"]["getAll"];

// The server leaves out senders and categories with no filters, so drop them here too.
function removeSharedFilter(groups: SharedFilterGroups, filterId: number) {
  const keep = (filter: { id: number }) => filter.id !== filterId;
  return groups
    .map((group) => ({
      ...group,
      uncategorizedFilters: group.uncategorizedFilters.filter(keep),
      categories: group.categories
        .map((category) => ({
          ...category,
          filters: category.filters.filter(keep),
          subCategories: category.subCategories
            .map((sub) => ({ ...sub, filters: sub.filters.filter(keep) }))
            .filter((sub) => sub.filters.length > 0),
        }))
        .filter(
          (category) =>
            category.filters.length > 0 || category.subCategories.length > 0,
        ),
    }))
    .filter(
      (group) =>
        group.uncategorizedFilters.length > 0 || group.categories.length > 0,
    );
}

export function DeleteSharedFilterDialog({
  filterId,
  open,
  onOpenChange,
}: DeleteSharedFilterDialogProps) {
  const utils = api.useUtils();
  const mutation = api.sharedFilter.delete.useMutation({
    onMutate: async ({ filterId }) => {
      await utils.sharedFilter.getAll.cancel();
      const previous = utils.sharedFilter.getAll.getData();
      utils.sharedFilter.getAll.setData(
        undefined,
        (groups) => groups && removeSharedFilter(groups, filterId),
      );
      return previous;
    },
    onSuccess: () => {
      toast.success("Filter removed from shared filters");
    },
    onError: (error, _variables, previous) => {
      utils.sharedFilter.getAll.setData(undefined, previous);
      toast.error(error.message);
    },
    onSettled: () => utils.sharedFilter.getAll.invalidate(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      filterId,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate({ filterId: data.filterId });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            By removing this filter, you won&apos;t be able to access it anymore
            unless it is shared with you again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AlertDialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Remove</Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
