"use client";

import { trackEvent } from "@/utils/rybbit";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedFilters } from "@/components/features/filters/components/saved-filters";
import { MyFilters } from "@/components/features/my-filters/components/my-filters";
import { ShareHelpDialog } from "@/components/features/my-filters/shared-filters/share-help-dialog";
import { SharedFiltersTab } from "@/components/features/my-filters/shared-filters/shared-filters-tab";

export function MyFiltersTabs() {
  return (
    <Tabs
      defaultValue='your-filters'
      className='mt-4'
      onValueChange={(value) => {
        trackEvent("my_filters_tab_changed", { tab: value });
      }}
    >
      <div className='inline-flex flex-col items-end gap-2 min-[412px]:items-start min-[600px]:flex-row sm:items-center sm:justify-between'>
        <TabsList>
          <TabsTrigger value='your-filters'>Your Filters</TabsTrigger>
          <TabsTrigger value='saved-filters'>Saved Filters</TabsTrigger>
          <TabsTrigger value='shared-filters'>Shared With You</TabsTrigger>
        </TabsList>

        <ShareHelpDialog />
      </div>

      <TabsContent value='your-filters'>
        <MyFilters />
      </TabsContent>
      <TabsContent value='saved-filters'>
        <SavedFilters />
      </TabsContent>
      <TabsContent value='shared-filters'>
        <SharedFiltersTab />
      </TabsContent>
    </Tabs>
  );
}
