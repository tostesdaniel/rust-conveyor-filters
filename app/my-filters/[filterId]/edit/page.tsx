import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getItems } from "@/actions/itemActions";
import { Typography } from "@/components/ui/typography";
import { EditFilterForm } from "@/app/my-filters/[filterId]/edit/edit-filter-form";

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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Typography variant='h1'>Edit Filter</Typography>
      <EditFilterForm filterId={Number(params.filterId)} />
    </HydrationBoundary>
  );
}
