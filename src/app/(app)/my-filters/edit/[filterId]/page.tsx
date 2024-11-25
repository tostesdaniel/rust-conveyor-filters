import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getItems } from "@/actions/itemActions";
import { getUserFilterById } from "@/lib/queries";
import { Typography } from "@/components/ui/typography";
import { EditFilterForm } from "@/app/(app)/my-filters/edit/[filterId]/edit-filter-form";

export async function generateMetadata({
  params,
}: {
  params: { filterId: string };
}): Promise<Metadata> {
  const [filter] = await getUserFilterById({
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

export default async function EditFilterPage({
  params,
}: {
  params: { filterId: string };
}) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  return (
    <>
      <Typography variant='h1'>Edit Filter</Typography>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EditFilterForm filterId={Number(params.filterId)} />
      </HydrationBoundary>
    </>
  );
}
