"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createFilterSchema } from "@/schemas/filterFormSchema";
import { api } from "@/trpc/react";
import { trackEvent } from "@/utils/rybbit";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Control, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { OwnerFilterDTO } from "@/types/filter";
import { useGetCategories } from "@/hooks/use-get-categories";
import { useGetItems } from "@/hooks/use-get-items";
import {
  getSavedSortPreference,
  sortFiltersByPreference,
} from "@/lib/utils/filter-sorting";
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
import { ConveyorCard } from "@/components/features/conveyor/conveyor-card";
import { FilterCategoryCombobox } from "@/components/features/my-filters/components/filter-category-combobox";
import { FilterImageCombobox } from "@/components/features/my-filters/components/filter-image-combobox";

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

  const utils = api.useUtils();
  const updateOrderMutation = api.filter.updateOrder.useMutation();

  const mutation = api.filter.create.useMutation({
    onSuccess: async (_, variables) => {
      trackEvent("filter_created");

      const { categoryId, subCategoryId } = variables.category;
      // Normalize undefined to null for type safety
      const normalizedCategoryId = categoryId ?? null;
      const normalizedSubCategoryId = subCategoryId ?? null;

      // Invalidate queries first to ensure fresh data
      await Promise.all([
        utils.filter.getByCategory.invalidate({
          categoryId: normalizedCategoryId,
        }),
        utils.category.getHierarchy.invalidate(),
      ]);

      // Get the sort preference for this category/subcategory
      const sortPreference = getSavedSortPreference(
        normalizedCategoryId,
        normalizedSubCategoryId,
      );

      try {
        let filtersToSort: OwnerFilterDTO[] = [];

        if (normalizedSubCategoryId) {
          // For subcategories, fetch the hierarchy and extract filters
          const hierarchy = await utils.category.getHierarchy.fetch();
          const subCategory = hierarchy
            ?.flatMap((cat) => cat.subCategories)
            .find((sub) => sub.id === normalizedSubCategoryId);
          filtersToSort = subCategory?.filters || [];
        } else {
          // For uncategorized and main categories, use getByCategory
          filtersToSort = await utils.filter.getByCategory.fetch({
            categoryId: normalizedCategoryId,
          });
        }

        // Only sort if there are 2+ filters
        if (filtersToSort.length >= 2) {
          const sortedFilters = sortFiltersByPreference(
            filtersToSort,
            sortPreference,
          );

          const filterUpdates = sortedFilters.map((filter, index) => ({
            filterId: filter.id,
            order: index,
          }));

          await updateOrderMutation.mutateAsync({
            filters: filterUpdates,
            categoryId: normalizedCategoryId,
            subCategoryId: normalizedSubCategoryId,
          });
        }

        toast.success("Filter created successfully");
        router.push("/my-filters");
      } catch (error) {
        // If sorting fails, still show success but log the error
        console.error("Failed to sort filters after creation:", error);
        toast.success("Filter created successfully");
        router.push("/my-filters");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: (_, __, variables) => {
      const { categoryId } = variables.category;
      utils.filter.getByCategory.invalidate({ categoryId: categoryId ?? null });
      utils.category.getHierarchy.invalidate();
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
        <div className='space-y-6 sm:flex sm:space-y-0 sm:space-x-6'>
          <FormField
            control={form.control}
            name='imagePath'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel className='after:ml-0.5 after:text-destructive after:content-["*"]'>
                  Cover Image
                </FormLabel>
                {items && <FilterImageCombobox field={field} items={items} />}
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
        <DevTool control={form.control as unknown as Control<FieldValues>} />
      )}
    </Form>
  );
}
