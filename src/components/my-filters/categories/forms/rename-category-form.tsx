"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { renameCategory } from "@/actions/categoryActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { useGetUserCategories } from "@/hooks/use-get-user-categories";
import { useGetUserCategoryHierarchy } from "@/hooks/use-get-user-category-hierarchy";
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
  isSubCategory?: boolean;
  setOpen: (open: boolean) => void;
}

export function RenameCategoryForm({
  categoryId,
  isSubCategory = false,
  setOpen,
}: RenameCategoryFormProps) {
  const { data: categories } = useGetUserCategories();
  const { data: categoryHierarchy } = useGetUserCategoryHierarchy();

  const existingName = isSubCategory
    ? categoryHierarchy
        ?.flatMap((category) => category.subCategories)
        .find((sub) => sub.id === categoryId)?.name
    : categories?.find((category) => category.id === categoryId)?.name;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingName ?? "",
    },
  });

  const queryClient = useQueryClient();

  const { mutateAsync: renameCategoryMutation, isPending } =
    useServerActionMutation(renameCategory, {
      onSuccess: () => {
        toast.success("Category renamed successfully");
        queryClient.invalidateQueries({
          queryKey: ["user-category-hierarchy"],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-categories"],
        });
      },
      onError: () => {
        toast.error("Failed to rename category");
      },
    });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await renameCategoryMutation({
      categoryId,
      name: data.name,
      isSubCategory,
    });
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
