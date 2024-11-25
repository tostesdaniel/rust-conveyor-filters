"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createFilterSchema } from "@/schemas/filterFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createFilter } from "@/actions/filterActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { useGetCategories } from "@/hooks/use-get-categories";
import { useGetItems } from "@/hooks/use-get-items";
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
import { ConveyorCard } from "@/components/conveyor-card";
import { FilterImageCombobox } from "@/components/filter-image-combobox";
import { FilterCategoryCombobox } from "@/components/my-filters/filter-category-combobox";

const DevTool = dynamic(
  () => import("@hookform/devtools").then((module) => module.DevTool),
  { ssr: false },
);

export default function NewFilterForm() {
  const router = useRouter();
  const { data: items } = useGetItems();
  const { data: _categories } = useGetCategories();

  const form = useForm<z.infer<typeof createFilterSchema>>({
    resolver: zodResolver(createFilterSchema),
    defaultValues: {
      name: "",
      imagePath: "",
      category: {
        categoryId: null,
        subCategoryId: null,
      },
      description: "",
      items: [],
      isPublic: false,
    },
  });

  const queryClient = useQueryClient();

  const mutation = useServerActionMutation(createFilter, {
    onSuccess: () => {
      toast.success("Filter created successfully");
      router.push("/my-filters");
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-filters-by-category", null],
      });
      queryClient.invalidateQueries({ queryKey: ["user-category-hierarchy"] });
    },
  });

  function onSubmit(data: z.infer<typeof createFilterSchema>) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 py-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='after:ml-0.5 after:text-destructive after:content-["*"]'>
                Name
              </FormLabel>
              <FormControl>
                <Input placeholder='Primitive weapons' {...field} />
              </FormControl>
              <FormDescription>
                Enter a name for your filter. This will be displayed to other
                users.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Can't leave your base unarmed" {...field} />
              </FormControl>
              <FormDescription>
                Enter a description for your filter. This will help others know
                what your filter is about.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='space-y-6 sm:flex sm:space-x-6 sm:space-y-0'>
          <FormField
            control={form.control}
            name='imagePath'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel className='after:ml-0.5 after:text-destructive after:content-["*"]'>
                  Cover Image
                </FormLabel>
                {items?.success && items.data && (
                  <FilterImageCombobox field={field} items={items.data} />
                )}
                <FormDescription>
                  Select an in-game item to represent your filter.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='category'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>Category</FormLabel>
                <FilterCategoryCombobox field={field} />
                <FormDescription>
                  Create or select a category for you to organize your filter
                  into. This can be changed later.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name='items'
          render={() => (
            <FormItem>
              <FormLabel className='after:ml-0.5 after:text-destructive after:content-["*"]'>
                Items
              </FormLabel>
              <FormDescription>
                Compose your conveyor by selecting items from the list.
              </FormDescription>
              <ConveyorCard />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting..." : "Create Filter"}
        </Button>
      </form>
      {process.env.NODE_ENV === "development" && (
        <DevTool control={form.control as any} />
      )}
    </Form>
  );
}
