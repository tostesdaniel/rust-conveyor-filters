import { Metadata } from "next";
import { api, HydrateClient } from "@/trpc/server";

import { Typography } from "@/components/shared/typography";

import NewFilterForm from "./new-filter-form";

export const metadata: Metadata = {
  title: "Create New Filter",
  description: "Create new conveyor filter.",
};

export default async function NewFilterPage({
  searchParams,
}: {
  searchParams: Promise<{ remixOf?: string }>;
}) {
  const { remixOf } = await searchParams;
  const remixOfId = remixOf ? Number(remixOf) : undefined;
  const validRemixId =
    remixOfId !== undefined && Number.isInteger(remixOfId) && remixOfId > 0
      ? remixOfId
      : undefined;

  await api.stats.getItems.prefetch();
  if (validRemixId) {
    await api.filter.getPublic.prefetch({ filterId: validRemixId });
  }

  return (
    <>
      <Typography variant='h1'>
        {validRemixId ? "Remix Filter" : "New Filter"}
      </Typography>
      <HydrateClient>
        <NewFilterForm remixOf={validRemixId} />
      </HydrateClient>
    </>
  );
}
