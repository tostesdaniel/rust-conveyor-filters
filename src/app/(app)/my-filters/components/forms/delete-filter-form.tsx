"use client";

import { Dispatch, SetStateAction } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deleteFilter } from "@/actions/filterActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
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
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardId,
    },
  });

  const mutation = useServerActionMutation(deleteFilter, {
    onSuccess: () => {
      toast.success("Filter deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["user-filters-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["user-filters"] });
      queryClient.invalidateQueries({ queryKey: ["user-category-hierarchy"] });
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
