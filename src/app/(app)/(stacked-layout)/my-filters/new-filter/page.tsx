import { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getItems } from "@/actions/itemActions";
import { Typography } from "@/components/ui/typography";

import NewFilterForm from "./new-filter-form";

export const metadata: Metadata = {
  title: "Create New Filter",
  description: "Create new conveyor filter.",
};

export default async function NewFilterPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  return (
    <>
      <Typography variant='h1'>New Filter</Typography>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <NewFilterForm />
      </HydrationBoundary>
    </>
  );
}
