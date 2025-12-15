"use client";

import { api } from "@/trpc/react";
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

export function DeleteSharedFilterDialog({
  filterId,
  open,
  onOpenChange,
}: DeleteSharedFilterDialogProps) {
  const utils = api.useUtils();
  const mutation = api.sharedFilter.delete.useMutation({
    onSuccess: () => {
      utils.sharedFilter.getAll.invalidate();
      toast.success("Filter removed from shared filters");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      filterId,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await mutation.mutateAsync({ filterId: data.filterId });
    } catch (error) {}
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
              <Button type='submit' disabled={mutation.isPending}>
                {mutation.isPending ? " Removing..." : "Remove"}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
