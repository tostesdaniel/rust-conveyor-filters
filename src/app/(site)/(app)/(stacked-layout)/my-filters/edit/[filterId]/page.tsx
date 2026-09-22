import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, HydrateClient } from "@/trpc/server";
import { auth } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";

import { Typography } from "@/components/shared/typography";
import { EditFilterForm } from "@/app/(site)/(app)/(stacked-layout)/my-filters/edit/[filterId]/edit-filter-form";

function parseFilterId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const filterId = Number(raw);
  return Number.isSafeInteger(filterId) && filterId > 0 ? filterId : null;
}

// ownsFilterProcedure throws FORBIDDEN for missing rows too, so a deleted filter
// has to land on 404. Cached so generateMetadata and the page share one query.
const getEditableFilter = cache(async (filterId: number) => {
  try {
    return await api.filter.getById({ filterId });
  } catch (error) {
    if (
      error instanceof TRPCError &&
      (error.code === "FORBIDDEN" || error.code === "NOT_FOUND")
    ) {
      return null;
    }
    throw error;
  }
});

export async function generateMetadata(props: {
  params: Promise<{ filterId: string }>;
}): Promise<Metadata> {
  await auth.protect();

  const params = await props.params;
  const filterId = parseFilterId(params.filterId);
  const filter = filterId === null ? null : await getEditableFilter(filterId);

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
  await auth.protect();

  const params = await props.params;
  const filterId = parseFilterId(params.filterId);

  if (filterId === null) {
    notFound();
  }

  const filter = await getEditableFilter(filterId);

  if (!filter) {
    notFound();
  }

  await api.stats.getItems.prefetch();

  return (
    <>
      <Typography variant='h1'>Edit Filter</Typography>
      <HydrateClient>
        <EditFilterForm filterId={filterId} />
      </HydrateClient>
    </>
  );
}
