"use client";

import { Dispatch, SetStateAction } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { deleteFilter } from "@/actions/filterActions";

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "../../../../components/ui/alert-dialog";
import { Form } from "../../../../components/ui/form";

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

  const mutation = useMutation({
    mutationFn: () => deleteFilter(cardId),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["user-filters"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error deleting filter");
    },
  });

  const { isPending } = mutation;

  const onSubmit = () => {
    mutation.mutate();
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
          <AlertDialogAction type='submit' disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </form>
    </Form>
  );
}
