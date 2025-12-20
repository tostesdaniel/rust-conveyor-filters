"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { PublicFilterListDTO } from "@/types/filter";
import { useGetPublicFilter } from "@/hooks/use-get-public-filter";
import { SharedFilterDialog } from "@/components/features/filters/components/shared-filter-dialog";

interface SharedFilterInfo {
  filter: PublicFilterListDTO;
  sharedBy: string | null;
}

interface FilterShareContextType {
  openFilter: (filter: PublicFilterListDTO, sharedBy?: string | null) => void;
  closeFilter: () => void;
}

const FilterShareContext = createContext<FilterShareContextType | null>(null);

export function FilterShareProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sharedFilter, setSharedFilter] = useState<SharedFilterInfo | null>(
    null,
  );
  const searchParams = useSearchParams();
  const sharedFilterId = searchParams.get("share");
  const sharedBy = searchParams.get("by");

  const { data: filter, error } = useGetPublicFilter(
    sharedFilterId ? parseInt(sharedFilterId) : undefined,
  );

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (filter) {
      setSharedFilter({ filter, sharedBy });
    }
  }, [filter, sharedBy]);

  const openFilter = (
    filter: PublicFilterListDTO,
    sharedBy: string | null = null,
  ) => {
    setSharedFilter({
      filter,
      sharedBy,
    });
  };

  const closeFilter = () => {
    setSharedFilter(null);
  };

  return (
    <FilterShareContext.Provider value={{ openFilter, closeFilter }}>
      {children}
      {sharedFilter && (
        <SharedFilterDialog
          filter={sharedFilter.filter}
          sharedBy={sharedBy}
          open={!!sharedFilter}
          onOpenChange={(open) => !open && closeFilter()}
        />
      )}
    </FilterShareContext.Provider>
  );
}

export function useFilterShare() {
  const context = useContext(FilterShareContext);
  if (!context) {
    throw new Error("useFilterShare must be used within FilterShareProvider");
  }
  return context;
}
