import type { Metadata } from "next";
import { getUserFilterById } from "@/services/queries";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getItems } from "@/actions/itemActions";
import { Typography } from "@/components/ui/typography";
import { EditFilterForm } from "@/app/(app)/(stacked-layout)/my-filters/edit/[filterId]/edit-filter-form";

export async function generateMetadata(props: {
  params: Promise<{ filterId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
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

export default async function EditFilterPage(props: {
  params: Promise<{ filterId: string }>;
}) {
  const params = await props.params;
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
