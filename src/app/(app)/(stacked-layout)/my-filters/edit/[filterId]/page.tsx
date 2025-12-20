import type { Metadata } from "next";
import { api, HydrateClient } from "@/trpc/server";

import { Typography } from "@/components/shared/typography";
import { EditFilterForm } from "@/app/(app)/(stacked-layout)/my-filters/edit/[filterId]/edit-filter-form";

export async function generateMetadata(props: {
  params: Promise<{ filterId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const filter = await api.filter.getById({
    filterId: Number(params.filterId),
  });

  if (!filter) {
    return {
      title: "Filter not found",
    };
  }

  return {
    title: `Editing: ${filter.name}`,
    description: filter.description ?? undefined,
  };
}

export default async function EditFilterPage(props: {
  params: Promise<{ filterId: string }>;
}) {
  const params = await props.params;

  await api.stats.getItems.prefetch();

  return (
    <>
      <Typography variant='h1'>Edit Filter</Typography>
      <HydrateClient>
        <EditFilterForm filterId={Number(params.filterId)} />
      </HydrateClient>
    </>
  );
}
