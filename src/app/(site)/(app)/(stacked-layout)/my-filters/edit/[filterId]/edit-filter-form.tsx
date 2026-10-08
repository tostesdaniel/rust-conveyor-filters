"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  createFilterSchema,
  type CreateFilter,
  type CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { api } from "@/trpc/react";
import { trackEvent } from "@/utils/rybbit";
import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "motion/react";
import {
  useForm,
  useFormState,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";

import { useBeforeUnloadWarning } from "@/hooks/use-before-unload-warning";
import { useEngagementScore } from "@/hooks/use-engagement-score";
import { useFilterFormDraft } from "@/hooks/use-filter-form-draft";
import { useGetItems } from "@/hooks/use-get-items";
import { useGetUserFilter } from "@/hooks/use-get-user-filter";
import { toOutputContainerShortname } from "@/lib/output-containers/container-table";
import { filterDraftBase, filterDraftKey } from "@/lib/utils/filter-draft";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormFieldScope,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConveyorCard } from "@/components/features/conveyor/conveyor-card";
import { OutputContainerField } from "@/components/features/conveyor/output-container-field";
import {
  OutputContainerSplitProvider,
  type LoadedValues,
} from "@/components/features/conveyor/output-container-split";
import { CancelFilterFormButton } from "@/components/features/my-filters/components/cancel-filter-form-button";
import { FilterCategoryCombobox } from "@/components/features/my-filters/components/filter-category-combobox";
import { FilterImageCombobox } from "@/components/features/my-filters/components/filter-image-combobox";
import { FormSkeleton } from "@/components/features/my-filters/components/form-skeleton";
import { FilterFormTourDemo } from "@/components/features/my-filters/filter-form-tour";
import { returnToFilter } from "@/components/features/my-filters/hooks/use-return-to-filter";
import { DraftRestoreBanner } from "@/components/shared/draft-restore-banner";

interface FilterItemBase {
  name: string;
  max: number;
  buffer: number;
  min: number;
}

interface ItemFilterItem extends FilterItemBase {
  itemId: number;
  shortname?: string;
  imagePath: string;
  iconVersion?: string | null;
}

interface CategoryFilterItem extends FilterItemBase {
  categoryId: number;
}

type FilterItem = ItemFilterItem | CategoryFilterItem;

const DevTool = dynamic(
  () => import("@hookform/devtools").then((module) => module.DevTool),
  { ssr: false },
);

function getDirtyData<T extends FieldValues>(
  allFields: T,
  dirtyFields: Partial<Record<keyof T, unknown>>,
): Partial<T> {
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
}

function getRemovedItems(
  initialItems: FilterItem[],
  currentItems: FilterItem[],
) {
  return initialItems.filter((initialItem) => {
    if ("itemId" in initialItem) {
      return !currentItems.some(
        (currentItem) =>
          "itemId" in currentItem && currentItem.itemId === initialItem.itemId,
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
}

function getAddedItems(initialItems: FilterItem[], currentItems: FilterItem[]) {
  return currentItems.filter((currentItem) => {
    if ("itemId" in currentItem) {
      return !initialItems.some(
        (initialItem) =>
          "itemId" in initialItem && initialItem.itemId === currentItem.itemId,
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
}

export function EditFilterForm({
  filterId,
  restoreDraft = false,
}: {
  filterId: number;
  restoreDraft?: boolean;
}) {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: items } = useGetItems();
  const { data, isError, error, isFetchedAfterMount, refetch } =
    useGetUserFilter(filterId);

  const form = useForm<CreateFilterInput, unknown, CreateFilter>({
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
      outputContainer: null,
      items: [],
    },
  });
  const { dirtyFields } = useFormState({ control: form.control });
  const initialItemsRef = React.useRef<FilterItem[]>([]);
  const hydratedForFilterIdRef = React.useRef<number | null>(null);
  const [saved, setSaved] = React.useState<LoadedValues | null>(null);
  const [perfectSmelting, setPerfectSmelting] = React.useState(true);
  const [loadedBase, setLoadedBase] = React.useState<{
    filterId: number;
    base: string;
  } | null>(null);
  const draftBase =
    loadedBase?.filterId === filterId ? loadedBase.base : undefined;
  const formDraft = useFilterFormDraft(
    form,
    userId && draftBase !== undefined
      ? filterDraftKey(userId, { kind: "edit", filterId })
      : null,
    {
      base: draftBase,
      savedCover: data?.imagePath,
      autoRestore: restoreDraft,
      perfectSmelting,
      onRestore: setSaved,
      onRestorePerfectSmelting: setPerfectSmelting,
    },
  );

  const utils = api.useUtils();
  const { trackAction } = useEngagementScore();

  const mutation = api.filter.update.useMutation({
    onSuccess: () => {
      formDraft.clear();
      trackEvent("filter_updated", { filterId });
      trackAction("filterEdit");
      toast.success("Filter updated successfully");
      utils.filter.getByCategory.invalidate();
      refetch();
      returnToFilter(filterId);
      router.push("/my-filters");
    },
    onError: (err) => {
      toast.error(err.message);
      refetch();
    },
  });

  React.useEffect(() => {
    hydratedForFilterIdRef.current = null;
  }, [filterId]);

  React.useEffect(() => {
    // Cached data may predate edits made in another tab.
    if (!data || data.id !== filterId || !isFetchedAfterMount) return;
    if (hydratedForFilterIdRef.current === filterId) return;

    hydratedForFilterIdRef.current = filterId;

    const initialItemsData = data.filterItems
      .map((filterItem): FilterItem | null => {
        if (filterItem.item && filterItem.itemId) {
          const { item } = filterItem;
          return {
            name: item.name,
            shortname: item.shortname ?? "",
            imagePath: item.imagePath,
            iconVersion: item.iconVersion,
            itemId: filterItem.itemId,
            max: filterItem.max,
            buffer: filterItem.buffer,
            min: filterItem.min,
          };
        } else if (filterItem.category && filterItem.categoryId) {
          return {
            name: filterItem.category.name,
            categoryId: filterItem.categoryId,
            max: filterItem.max,
            buffer: filterItem.buffer,
            min: filterItem.min,
          };
        }
        return null;
      })
      .filter((item): item is FilterItem => item !== null);

    initialItemsRef.current = initialItemsData;
    const outputContainer = toOutputContainerShortname(
      data.outputContainer?.shortname,
    );
    setSaved({ outputContainer, items: initialItemsData });
    const loaded: CreateFilterInput = {
      name: data.name,
      description: data.description ?? "",
      imagePath: data.imagePath,
      category: {
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
      },
      isPublic: data.isPublic,
      outputContainer,
      items: initialItemsData,
    };
    form.reset(loaded);
    setLoadedBase({ filterId, base: filterDraftBase(loaded) });

    void form.trigger();
  }, [data, filterId, form, isFetchedAfterMount]);

  const { isDirty } = form.formState;
  useBeforeUnloadWarning(isDirty && !mutation.isPending && !mutation.isSuccess);

  function leave() {
    formDraft.clear();
    returnToFilter(filterId);
    router.push("/my-filters");
  }

  async function onSubmit(data: CreateFilter) {
    const dirtyData = getDirtyData(data, dirtyFields);
    const removedItems = getRemovedItems(initialItemsRef.current, data.items);
    const addedItems = getAddedItems(initialItemsRef.current, data.items);
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

  if (draftBase === undefined) {
    return <FormSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 py-6'>
        <AnimatePresence>
          {formDraft.draft && (
            <DraftRestoreBanner
              key='draft'
              savedAt={formDraft.draft.savedAt}
              stale={formDraft.isStale}
              onRestore={formDraft.restore}
              onDiscard={formDraft.discard}
              className='mb-0 pb-6'
            />
          )}
        </AnimatePresence>
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
        <div className='gap-y-6 sm:flex sm:space-y-0 sm:space-x-6'>
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
        <OutputContainerSplitProvider
          saved={saved}
          perfectSmelting={perfectSmelting}
          onPerfectSmeltingChange={setPerfectSmelting}
        >
          <OutputContainerField />
          <FilterFormTourDemo />
          <FormFieldScope name='items'>
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
          </FormFieldScope>
        </OutputContainerSplitProvider>
        <div className='flex gap-x-2'>
          <Button type='submit' disabled={mutation.isPending || !isDirty}>
            {mutation.isPending ? "Updating..." : "Update Filter"}
          </Button>
          {isDirty && (
            <CancelFilterFormButton
              disabled={mutation.isPending}
              onLeave={leave}
            />
          )}
        </div>
      </form>
      {process.env.NODE_ENV === "development" && (
        <DevTool control={form.control as unknown as Control<FieldValues>} />
      )}
    </Form>
  );
}
