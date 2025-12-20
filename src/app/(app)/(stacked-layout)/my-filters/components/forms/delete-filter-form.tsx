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

  const mutation = api.filter.delete.useMutation({
    onSuccess: () => {
      trackEvent("my_filter_deleted", { filterId: cardId });
      toast.success("Filter deleted successfully");
      utils.filter.getByCategory.invalidate();
      utils.filter.getAll.invalidate();
      utils.category.getHierarchy.invalidate();
      setOpen(false);
    },
    onError: () => {
      toast.error("Error deleting filter");
    },
  });

  const { isPending } = mutation;

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await mutation.mutateAsync({ filterId: data.cardId });
    } catch (error) {}
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </AlertDialogCancel>
          <Button type='submit' disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </form>
    </Form>
  );
}
