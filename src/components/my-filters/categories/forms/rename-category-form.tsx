"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { renameCategory } from "@/actions/categoryActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { useGetUserCategories } from "@/hooks/use-get-user-categories";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Category name must be at least 1 character long" })
    .max(255, { message: "Category name must be at most 255 characters long" }),
});

interface RenameCategoryFormProps {
  categoryId: number;
  setOpen: (open: boolean) => void;
}

export function RenameCategoryForm({
  categoryId,
  setOpen,
}: RenameCategoryFormProps) {
  const category = useGetUserCategories().data?.find(
    (category) => category.id === categoryId,
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name,
    },
  });

  const queryClient = useQueryClient();

  const { mutateAsync: renameCategoryMutation, isPending } =
    useServerActionMutation(renameCategory, {
      onSuccess: () => {
        toast.success("Category renamed successfully");
        queryClient.invalidateQueries({ queryKey: ["user-categories"] });
        queryClient.invalidateQueries({
          queryKey: ["categories-with-own-filters"],
        });
      },
      onError: () => {
        toast.error("Failed to rename category");
      },
    });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await renameCategoryMutation({ categoryId, name: data.name });
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className='space-y-6'
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Clothing' {...field} />
              </FormControl>
              <FormDescription>
                This is the name of the category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex flex-col justify-stretch sm:flex-row sm:justify-end'>
          <Button type='submit' disabled={isPending} className=''>
            {isPending ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
