"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import {
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";

type Hierarchy = RouterOutputs["category"]["getHierarchy"];
type CategoryNode = Hierarchy[number];
type SubCategoryNode = CategoryNode["subCategories"][number];
type FilterNode = CategoryNode["filters"][number];
type UncategorizedFilters = RouterOutputs["filter"]["getByCategory"];

export const UNCATEGORIZED_BUCKET_ID = "bucket-uncat";

export function categoryBucketId(categoryId: number) {
  return `bucket-cat-${categoryId}`;
}

export function subCategoryBucketId(subCategoryId: number) {
  return `bucket-subcat-${subCategoryId}`;
}

export function filterDraggableId(filterId: number) {
  return `filter-${filterId}`;
}

export function categoryDraggableId(categoryId: number) {
  return `category-${categoryId}`;
}

export function subCategoryDraggableId(subCategoryId: number) {
  return `subcategory-${subCategoryId}`;
}

type ActiveItem =
  | { type: "filter"; filter: FilterNode }
  | { type: "category"; category: CategoryNode }
  | { type: "subcategory"; subcategory: SubCategoryNode };

interface BucketLocation {
  categoryId: number | null;
  subCategoryId: number | null;
}

function parseBucketId(id: string): BucketLocation | null {
  if (id === UNCATEGORIZED_BUCKET_ID) {
    return { categoryId: null, subCategoryId: null };
  }
  if (id.startsWith("bucket-cat-")) {
    return {
      categoryId: Number(id.slice("bucket-cat-".length)),
      subCategoryId: null,
    };
  }
  if (id.startsWith("bucket-subcat-")) {
    return {
      categoryId: null,
      subCategoryId: Number(id.slice("bucket-subcat-".length)),
    };
  }
  return null;
}

export function useSortableHierarchy() {
  const utils = api.useUtils();
  const hierarchyQuery = api.category.getHierarchy.useQuery();
  const uncategorizedQuery = api.filter.getByCategory.useQuery({
    categoryId: null,
  });
  const preferencesQuery = api.userPreferences.get.useQuery();

  const [localCategories, setLocalCategories] = useState<Hierarchy>(
    hierarchyQuery.data ?? [],
  );
  const [localUncategorized, setLocalUncategorized] =
    useState<UncategorizedFilters>(uncategorizedQuery.data ?? []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  // Re-sync when server data arrives (after mutation invalidation).
  // Only depends on server data — not activeId — so dropping doesn't reset
  // optimistic local state before the server confirms the new positions.
  useEffect(() => {
    if (!isDraggingRef.current && hierarchyQuery.data) {
      setLocalCategories(hierarchyQuery.data);
    }
  }, [hierarchyQuery.data]);

  useEffect(() => {
    if (!isDraggingRef.current && uncategorizedQuery.data) {
      setLocalUncategorized(uncategorizedQuery.data);
    }
  }, [uncategorizedQuery.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const moveFilter = api.filter.moveToPosition.useMutation({
    onError: (err) => {
      toast.error(err.message || "Failed to move filter");
    },
    onSettled: () => {
      utils.category.getHierarchy.invalidate();
      utils.filter.getByCategory.invalidate({ categoryId: null });
    },
  });

  const updateCategoryOrder = api.category.updateOrder.useMutation({
    onError: (err) => {
      toast.error(err.message || "Failed to reorder categories");
    },
    onSettled: () => {
      utils.category.getHierarchy.invalidate();
    },
  });

  const updateSubCategoryOrder =
    api.category.updateSubCategoryOrder.useMutation({
      onError: (err) => {
        toast.error(err.message || "Failed to reorder subcategories");
      },
      onSettled: () => {
        utils.category.getHierarchy.invalidate();
      },
    });

  const updatePreferences = api.userPreferences.update.useMutation({
    onMutate: async ({ uncategorizedPosition }) => {
      await utils.userPreferences.get.cancel();
      const previous = utils.userPreferences.get.getData();
      utils.userPreferences.get.setData(undefined, (old) => ({
        userId: old?.userId ?? "",
        uncategorizedPosition,
      }));
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        utils.userPreferences.get.setData(undefined, context.previous);
      }
      toast.error(err.message || "Failed to update preference");
    },
    onSettled: () => {
      utils.userPreferences.get.invalidate();
    },
  });

  const findFilterById = (id: number) => {
    for (const f of localUncategorized) {
      if (f.id === id) return { filter: f, location: bucketLocationForFilter(f) };
    }
    for (const cat of localCategories) {
      for (const f of cat.filters) {
        if (f.id === id)
          return { filter: f, location: bucketLocationForFilter(f) };
      }
      for (const sub of cat.subCategories) {
        for (const f of sub.filters) {
          if (f.id === id)
            return { filter: f, location: bucketLocationForFilter(f) };
        }
      }
    }
    return null;
  };

  function bucketLocationForFilter(filter: FilterNode): BucketLocation {
    return {
      categoryId: filter.categoryId,
      subCategoryId: filter.subCategoryId,
    };
  }

  function bucketLocationFromOverId(overId: string): BucketLocation | null {
    const direct = parseBucketId(overId);
    if (direct) return direct;
    if (overId.startsWith("filter-")) {
      const fid = Number(overId.slice("filter-".length));
      const found = findFilterById(fid);
      return found ? found.location : null;
    }
    if (overId.startsWith("category-")) {
      const cid = Number(overId.slice("category-".length));
      return { categoryId: cid, subCategoryId: null };
    }
    if (overId.startsWith("subcategory-")) {
      const sid = Number(overId.slice("subcategory-".length));
      return { categoryId: null, subCategoryId: sid };
    }
    return null;
  }

  function readBucket(loc: BucketLocation): FilterNode[] {
    if (loc.categoryId === null && loc.subCategoryId === null) {
      return localUncategorized;
    }
    if (loc.subCategoryId !== null) {
      for (const cat of localCategories) {
        for (const sub of cat.subCategories) {
          if (sub.id === loc.subCategoryId) return sub.filters;
        }
      }
      return [];
    }
    if (loc.categoryId !== null) {
      const cat = localCategories.find((c) => c.id === loc.categoryId);
      return cat ? cat.filters : [];
    }
    return [];
  }

  function writeBucket(loc: BucketLocation, next: FilterNode[]) {
    if (loc.categoryId === null && loc.subCategoryId === null) {
      setLocalUncategorized(next);
      return;
    }
    if (loc.subCategoryId !== null) {
      setLocalCategories((cats) =>
        cats.map((cat) => ({
          ...cat,
          subCategories: cat.subCategories.map((sub) =>
            sub.id === loc.subCategoryId ? { ...sub, filters: next } : sub,
          ),
        })),
      );
      return;
    }
    if (loc.categoryId !== null) {
      setLocalCategories((cats) =>
        cats.map((cat) =>
          cat.id === loc.categoryId ? { ...cat, filters: next } : cat,
        ),
      );
    }
  }

  const activeItem: ActiveItem | null = useMemo(() => {
    if (!activeId) return null;
    if (activeId.startsWith("filter-")) {
      const fid = Number(activeId.slice("filter-".length));
      const found = findFilterById(fid);
      return found ? { type: "filter", filter: found.filter } : null;
    }
    if (activeId.startsWith("category-")) {
      const cid = Number(activeId.slice("category-".length));
      const category = localCategories.find((c) => c.id === cid);
      return category ? { type: "category", category } : null;
    }
    if (activeId.startsWith("subcategory-")) {
      const sid = Number(activeId.slice("subcategory-".length));
      for (const cat of localCategories) {
        const sub = cat.subCategories.find((s) => s.id === sid);
        if (sub) return { type: "subcategory", subcategory: sub };
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, localCategories, localUncategorized]);

  function onDragStart(event: DragStartEvent) {
    isDraggingRef.current = true;
    setActiveId(String(event.active.id));
  }

  const collisionDetectionStrategy = useCallback(
    (args: Parameters<typeof closestCorners>[0]) => {
      if (activeId?.startsWith("category-")) {
        const categoryDroppables = args.droppableContainers.filter((d) =>
          String(d.id).startsWith("category-"),
        );
        return closestCenter({ ...args, droppableContainers: categoryDroppables });
      }
      if (activeId?.startsWith("subcategory-")) {
        const subCategoryDroppables = args.droppableContainers.filter((d) =>
          String(d.id).startsWith("subcategory-"),
        );
        return closestCenter({
          ...args,
          droppableContainers: subCategoryDroppables,
        });
      }

      // Dragging a filter: only consider filter cards and buckets. The
      // category-*/subcategory-* section sortables have huge rects that would
      // otherwise win the closest-corner contest, hijacking the drop onto the
      // wrong category (especially near a bucket's top/bottom edge) and making
      // subcategory buckets unreachable.
      const filterDroppables = args.droppableContainers.filter((d) => {
        const id = String(d.id);
        return id.startsWith("filter-") || id.startsWith("bucket-");
      });

      const pointerCollisions = pointerWithin({
        ...args,
        droppableContainers: filterDroppables,
      });
      if (pointerCollisions.length > 0) {
        // Prefer a filter card directly under the pointer so we reorder
        // relative to it; fall back to the enclosing bucket (e.g. empty space).
        const filterHit = pointerCollisions.find((c) =>
          String(c.id).startsWith("filter-"),
        );
        return filterHit ? [filterHit] : pointerCollisions;
      }

      // Pointer is in a gap (gutter between cards, padding) — snap to nearest.
      return closestCorners({
        ...args,
        droppableContainers: filterDroppables,
      });
    },
    [activeId],
  );

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (activeIdStr === overIdStr) return;

    if (activeIdStr.startsWith("category-")) {
      if (!overIdStr.startsWith("category-")) return;
      const activeCid = Number(activeIdStr.slice("category-".length));
      const overCid = Number(overIdStr.slice("category-".length));
      if (activeCid === overCid) return;
      const oldIndex = localCategories.findIndex((c) => c.id === activeCid);
      const newIndex = localCategories.findIndex((c) => c.id === overCid);
      if (oldIndex === -1 || newIndex === -1) return;
      setLocalCategories((prev) => arrayMove(prev, oldIndex, newIndex));
      return;
    }

    if (activeIdStr.startsWith("subcategory-")) {
      if (!overIdStr.startsWith("subcategory-")) return;
      const activeSid = Number(activeIdStr.slice("subcategory-".length));
      const overSid = Number(overIdStr.slice("subcategory-".length));
      if (activeSid === overSid) return;
      setLocalCategories((cats) =>
        cats.map((cat) => {
          const oldIndex = cat.subCategories.findIndex((s) => s.id === activeSid);
          const newIndex = cat.subCategories.findIndex((s) => s.id === overSid);
          if (oldIndex === -1 || newIndex === -1) return cat;
          return {
            ...cat,
            subCategories: arrayMove(cat.subCategories, oldIndex, newIndex),
          };
        }),
      );
      return;
    }

    if (!activeIdStr.startsWith("filter-")) return;

    const filterId = Number(activeIdStr.slice("filter-".length));
    const source = findFilterById(filterId);
    if (!source) return;
    const destLoc = bucketLocationFromOverId(overIdStr);
    if (!destLoc) return;

    const sameBucket =
      source.location.categoryId === destLoc.categoryId &&
      source.location.subCategoryId === destLoc.subCategoryId;

    if (sameBucket) {
      // onDragEnd reads the already-correct position from local state.
      if (!overIdStr.startsWith("filter-")) return;
      const bucket = readBucket(source.location);
      const oldIndex = bucket.findIndex((f) => f.id === filterId);
      const overFid = Number(overIdStr.slice("filter-".length));
      const newIndex = bucket.findIndex((f) => f.id === overFid);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      writeBucket(source.location, arrayMove(bucket, oldIndex, newIndex));
      return;
    }

    const sourceBucket = readBucket(source.location).filter(
      (f) => f.id !== filterId,
    );
    const destBucket = readBucket(destLoc).filter((f) => f.id !== filterId);

    // Insert at end if dropping on container/heading; insert at index if over a filter
    let insertIndex = destBucket.length;
    if (overIdStr.startsWith("filter-")) {
      const overFid = Number(overIdStr.slice("filter-".length));
      const idx = destBucket.findIndex((f) => f.id === overFid);
      if (idx >= 0) insertIndex = idx;
    }

    const movedFilter: FilterNode = {
      ...source.filter,
      categoryId: destLoc.categoryId,
      subCategoryId: destLoc.subCategoryId,
    };
    destBucket.splice(insertIndex, 0, movedFilter);

    writeBucket(source.location, sourceBucket);
    writeBucket(destLoc, destBucket);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeIdStr = String(active.id);
    isDraggingRef.current = false;
    setActiveId(null);

    if (!over) {
      if (hierarchyQuery.data) setLocalCategories(hierarchyQuery.data);
      if (uncategorizedQuery.data) setLocalUncategorized(uncategorizedQuery.data);
      return;
    }

    if (activeIdStr.startsWith("filter-")) {
      const filterId = Number(activeIdStr.slice("filter-".length));
      // onDragOver already moved the filter to its correct optimistic position;
      // just read where it landed and commit that to the server.
      const found = findFilterById(filterId);
      if (!found) return;
      const destBucket = readBucket(found.location);
      const destIndex = destBucket.findIndex((f) => f.id === filterId);
      if (destIndex === -1) return;
      moveFilter.mutate({
        filterId,
        destCategoryId: found.location.categoryId,
        destSubCategoryId: found.location.subCategoryId,
        destIndex,
      });
      return;
    }

    if (activeIdStr.startsWith("category-")) {
      if (!over) return;
      updateCategoryOrder.mutate({
        categories: localCategories.map((c, idx) => ({ id: c.id, order: idx })),
      });
      return;
    }

    if (activeIdStr.startsWith("subcategory-")) {
      if (!over) return;
      const activeSid = Number(activeIdStr.slice("subcategory-".length));
      let parentId: number | null = null;
      let reorderedSubs: SubCategoryNode[] = [];
      for (const cat of localCategories) {
        const idx = cat.subCategories.findIndex((s) => s.id === activeSid);
        if (idx !== -1) {
          parentId = cat.id;
          reorderedSubs = cat.subCategories;
          break;
        }
      }
      if (!parentId) return;
      updateSubCategoryOrder.mutate({
        parentId,
        subCategories: reorderedSubs.map((s, idx) => ({ id: s.id, order: idx })),
      });
      return;
    }
  }

  function onDragCancel() {
    isDraggingRef.current = false;
    setActiveId(null);
    if (hierarchyQuery.data) setLocalCategories(hierarchyQuery.data);
    if (uncategorizedQuery.data) setLocalUncategorized(uncategorizedQuery.data);
  }

  return {
    categories: localCategories,
    uncategorizedFilters: localUncategorized,
    uncategorizedPosition: preferencesQuery.data?.uncategorizedPosition ?? "top",
    activeItem,
    activeId,
    sensors,
    collisionDetectionStrategy,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    updatePreferences,
  };
}
