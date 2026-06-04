"use client";

import Image from "next/image";
import { getR2ImageUrl } from "@/utils/r2-images";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderPlusIcon, GripVertical, PlusIcon } from "lucide-react";

import type { OwnerFilterDTO } from "@/types/filter";
import { CategoryHeading } from "@/components/features/my-filters/categories/category-heading";
import { MyFilterCard as FilterCard } from "@/components/features/my-filters/components/my-filter-card";
import {
  categoryBucketId,
  categoryDraggableId,
  filterDraggableId,
  subCategoryBucketId,
  subCategoryDraggableId,
  UNCATEGORIZED_BUCKET_ID,
  useSortableHierarchy,
} from "@/components/features/my-filters/hooks/use-sortable-hierarchy";
import { EmptyState } from "@/components/shared/empty-state";

export function MyFilters() {
  const {
    categories,
    uncategorizedFilters,
    uncategorizedPosition,
    activeItem,
    sensors,
    collisionDetectionStrategy,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
  } = useSortableHierarchy();

  const hasFilters = uncategorizedFilters.length > 0 || categories.length > 0;

  if (!hasFilters) {
    return (
      <EmptyState
        Icon={FolderPlusIcon}
        title='No filters'
        description='Get started by creating a new filter.'
        label='New Filter'
        ButtonIcon={PlusIcon}
        redirectUrl='/my-filters/new-filter'
      />
    );
  }

  const uncategorizedSection = (
    <section className='py-6'>
      <CategoryHeading
        title='No category'
        withAction
        filters={uncategorizedFilters}
      />
      <FilterBucket
        droppableId={UNCATEGORIZED_BUCKET_ID}
        filters={uncategorizedFilters}
      />
    </section>
  );

  const categoryIds = categories.map((c) => categoryDraggableId(c.id));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
      autoScroll
    >
      {uncategorizedPosition === "top" && uncategorizedSection}

      <SortableContext
        items={categoryIds}
        strategy={verticalListSortingStrategy}
      >
        {categories.map((category) => (
          <SortableCategorySection key={category.id} category={category} />
        ))}
      </SortableContext>

      {uncategorizedPosition === "bottom" && uncategorizedSection}

      <DragOverlay>
        {activeItem?.type === "filter" ? (
          <FilterCardOverlay filter={activeItem.filter} />
        ) : activeItem?.type === "category" ? (
          <div className='rounded-md bg-card px-4 py-2 opacity-90 shadow-lg'>
            <div className='flex items-center gap-1.5'>
              <GripVertical className='size-4 text-muted-foreground' />
              <span className='text-base leading-6 font-semibold'>
                {activeItem.category.name}
              </span>
            </div>
          </div>
        ) : activeItem?.type === "subcategory" ? (
          <div className='rounded-md bg-card px-4 py-2 opacity-90 shadow-lg'>
            <div className='flex items-center gap-1.5'>
              <GripVertical className='size-4 text-muted-foreground' />
              <span className='text-base leading-6 font-semibold'>
                {activeItem.subcategory.name}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableCategorySectionProps {
  category: ReturnType<typeof useSortableHierarchy>["categories"][number];
}

function SortableCategorySection({ category }: SortableCategorySectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: categoryDraggableId(category.id),
    data: { type: "category" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  const subCategoryIds = category.subCategories.map((s) =>
    subCategoryDraggableId(s.id),
  );

  return (
    <section ref={setNodeRef} style={style} className='py-6'>
      <CategoryHeading
        title={category.name}
        categoryId={category.id}
        canCreateSubcategory
        filters={category.filters}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />

      <FilterBucket
        droppableId={categoryBucketId(category.id)}
        filters={category.filters}
      />

      <SortableContext
        items={subCategoryIds}
        strategy={verticalListSortingStrategy}
      >
        {category.subCategories.map((subCategory) => (
          <SortableSubCategorySection
            key={subCategory.id}
            subCategory={subCategory}
          />
        ))}
      </SortableContext>
    </section>
  );
}

interface SortableSubCategorySectionProps {
  subCategory: ReturnType<
    typeof useSortableHierarchy
  >["categories"][number]["subCategories"][number];
}

function SortableSubCategorySection({
  subCategory,
}: SortableSubCategorySectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subCategoryDraggableId(subCategory.id),
    data: { type: "subcategory", parentId: subCategory.parentId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='ml-6 border-l border-border py-6 pl-6'
    >
      <CategoryHeading
        title={subCategory.name}
        withAction={false}
        categoryId={subCategory.id}
        isSubCategory
        filters={subCategory.filters}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
      <FilterBucket
        droppableId={subCategoryBucketId(subCategory.id)}
        filters={subCategory.filters}
      />
    </div>
  );
}

interface FilterBucketProps {
  droppableId: UniqueIdentifier;
  filters: OwnerFilterDTO[];
}

function FilterCardOverlay({ filter }: { filter: OwnerFilterDTO }) {
  return (
    <div className='flex min-w-[300px] overflow-hidden rounded-md opacity-90 shadow-lg'>
      <div className='flex w-16 shrink-0 items-center justify-center rounded-l-md border-2 border-foreground/70 bg-card p-1.5'>
        <Image
          src={getR2ImageUrl(filter.imagePath + ".webp", "medium")}
          alt=''
          width='64'
          height='64'
        />
      </div>
      <div className='flex flex-1 items-center overflow-hidden rounded-r-md border-2 border-l-0 border-card-foreground/70 bg-background px-4 py-2 text-sm'>
        <div className='overflow-hidden'>
          <p className='overflow-hidden font-medium text-ellipsis'>
            {filter.name}
          </p>
          <p className='text-muted-foreground'>{`${filter.filterItems.length} items`}</p>
        </div>
      </div>
    </div>
  );
}

function FilterBucket({ droppableId, filters }: FilterBucketProps) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const itemIds = filters.map((f) => filterDraggableId(f.id));

  return (
    <SortableContext items={itemIds} strategy={rectSortingStrategy}>
      {filters.length > 0 ? (
        <ul
          ref={setNodeRef}
          className='mt-6 grid grid-cols-1 gap-5 pl-4 min-[680px]:grid-cols-2 sm:gap-6 lg:grid-cols-3'
        >
          {filters.map((filter) => (
            <FilterCard key={filter.id} filter={filter} />
          ))}
        </ul>
      ) : (
        <div
          ref={setNodeRef}
          className={`mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground transition-colors ${
            isOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          No filters in this category.
        </div>
      )}
    </SortableContext>
  );
}
