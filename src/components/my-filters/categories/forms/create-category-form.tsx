"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createCategory as createCategoryAction } from "@/actions/userCategoryActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
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

interface CreateCategoryFormProps {
  setOpen: (open: boolean) => void;
  parentId: number | null;
}

export function CreateCategoryForm({
  setOpen,
  parentId,
}: CreateCategoryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const queryClient = useQueryClient();

  const { mutate: createCategory, isPending } = useServerActionMutation(
    createCategoryAction,
    {
      onSuccess: () => {
        toast.success(
          parentId
            ? "Subcategory created successfully"
            : "Category created successfully",
        );
        setOpen(false);
        queryClient.invalidateQueries({
          queryKey: ["user-categories"],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-category-hierarchy"],
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    },
  );

  function onSubmit(data: z.infer<typeof formSchema>) {
    createCategory({ name: data.name, parentId });
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
                This is the name of the {parentId ? "subcategory" : "category"}.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex flex-col justify-stretch sm:flex-row sm:justify-end'>
          <Button type='submit' disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
