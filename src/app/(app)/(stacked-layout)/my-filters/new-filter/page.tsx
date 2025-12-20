import { Metadata } from "next";
import { api, HydrateClient } from "@/trpc/server";

import { Typography } from "@/components/shared/typography";

import NewFilterForm from "./new-filter-form";

export const metadata: Metadata = {
  title: "Create New Filter",
  description: "Create new conveyor filter.",
};

export default async function NewFilterPage() {
  await api.stats.getItems.prefetch();

  return (
    <>
      <Typography variant='h1'>New Filter</Typography>
      <HydrateClient>
        <NewFilterForm />
      </HydrateClient>
    </>
  );
}
