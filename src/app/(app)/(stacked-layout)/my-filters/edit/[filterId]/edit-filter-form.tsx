"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createFilterSchema } from "@/schemas/filterFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useForm,
  useFormState,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateFilter } from "@/actions/filterActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { useGetItems } from "@/hooks/use-get-items";
import { useGetUserFilter } from "@/hooks/use-get-user-filter";
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
import { FilterCategoryCombobox } from "@/components/features/my-filters/components/filter-category-combobox";
import { FormSkeleton } from "@/components/features/my-filters/components/form-skeleton";
import { FilterImageCombobox } from "@/components/filter-image-combobox";

interface FilterItemBase {
  name: string;
  max: number;
  buffer: number;
  min: number;
  createdAt?: Date | string;
}

interface ItemFilterItem extends FilterItemBase {
  itemId: number;
  shortname?: string;
  imagePath: string;
}

interface CategoryFilterItem extends FilterItemBase {
  categoryId: number;
}

type FilterItem = ItemFilterItem | CategoryFilterItem;

const DevTool = dynamic(
  () => import("@hookform/devtools").then((module) => module.DevTool),
  { ssr: false },
);

export function EditFilterForm({ filterId }: { filterId: number }) {
  const router = useRouter();
  const { data: items } = useGetItems();
  const { data, isError, error, isLoading, refetch } =
    useGetUserFilter(filterId);

  const form = useForm<z.infer<typeof createFilterSchema>>({
    resolver: zodResolver(createFilterSchema),
    defaultValues: {
      name: "",
      description: "",
      imagePath: "",
      category: {
        categoryId: null,
        subCategoryId: null,
      },
      isPublic: false,
      items: [],
    },
  });
  const { dirtyFields } = useFormState({ control: form.control });
  const [initialItems, setInitialItems] = React.useState<FilterItem[]>([]);

  const queryClient = useQueryClient();

  const mutation = useServerActionMutation(updateFilter, {
    onSuccess: () => {
      toast.success("Filter updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user-filters-by-category"] });
      refetch();
      router.push("/my-filters");
    },
    onError: (err) => {
      toast.error(err.message);
      refetch();
    },
  });

  React.useEffect(() => {
    if (data) {
      const initialItemsData = data.filterItems
        .map((filterItem): FilterItem | null => {
          if (filterItem.item) {
            const { item } = filterItem;
            return {
              name: item.name,
              shortname: item.shortname ?? "",
              imagePath: item.imagePath,
              itemId: item.id,
              max: filterItem.max,
              buffer: filterItem.buffer,
              min: filterItem.min,
              createdAt: filterItem.createdAt,
            };
          } else if (filterItem.category) {
            return {
              name: filterItem.category.name,
              categoryId: filterItem.category.id,
              max: filterItem.max,
              buffer: filterItem.buffer,
              min: filterItem.min,
              createdAt: filterItem.createdAt,
            };
          }
          return null;
        })
        .filter((item): item is FilterItem => item !== null);

      setInitialItems(initialItemsData);
      form.reset({
        name: data.name,
        description: data.description ?? "",
        imagePath: data.imagePath,
        category: {
          categoryId: data.categoryId,
          subCategoryId: data.subCategoryId,
        },
        isPublic: data.isPublic,
        items: initialItemsData,
      });

      form.trigger();
    }
  }, [data, form]);

  const getDirtyData = <T extends FieldValues>(
    allFields: T,
    dirtyFields: Partial<Record<keyof T, unknown>>,
  ): Partial<T> => {
    const changedFieldValues = Object.keys(dirtyFields).reduce(
      (acc, currentField) => {
        return {
          ...acc,
          [currentField]: allFields[currentField],
        };
      },
      {} as Partial<T>,
    );

    return changedFieldValues;
  };

  const getRemovedItems = (
    initialItems: FilterItem[],
    currentItems: FilterItem[],
  ) => {
    return initialItems.filter((initialItem) => {
      if ("itemId" in initialItem) {
        return !currentItems.some(
          (currentItem) =>
            "itemId" in currentItem &&
            currentItem.itemId === initialItem.itemId,
        );
      } else if ("categoryId" in initialItem) {
        return !currentItems.some(
          (currentItem) =>
            "categoryId" in currentItem &&
            currentItem.categoryId === initialItem.categoryId,
        );
      }
      return false;
    });
  };

  const getAddedItems = (
    initialItems: FilterItem[],
    currentItems: FilterItem[],
  ) => {
    return currentItems.filter((currentItem) => {
      if ("itemId" in currentItem) {
        return !initialItems.some(
          (initialItem) =>
            "itemId" in initialItem &&
            initialItem.itemId === currentItem.itemId,
        );
      } else if ("categoryId" in currentItem) {
        return !initialItems.some(
          (initialItem) =>
            "categoryId" in initialItem &&
            initialItem.categoryId === currentItem.categoryId,
        );
      }
      return false;
    });
  };

  async function onSubmit(data: z.infer<typeof createFilterSchema>) {
    const dirtyData = getDirtyData(data, dirtyFields);
    const removedItems = getRemovedItems(initialItems, data.items);
    const addedItems = getAddedItems(initialItems, data.items);
    await mutation.mutateAsync({
      data: dirtyData,
      filterId,
      removedItems,
      addedItems,
    });
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading) {
    return <FormSkeleton />;
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
        <Button
          type='submit'
          disabled={mutation.isPending || !form.formState.isDirty}
        >
          {mutation.isPending ? "Updating..." : "Update Filter"}
        </Button>
      </form>
      {process.env.NODE_ENV === "development" && (
        <DevTool control={form.control as unknown as Control<FieldValues>} />
      )}
    </Form>
  );
}
