import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getFiltersWithItems } from "@/lib/queries";
import { MyFilters } from "@/components/my-filters";

export default async function MyFiltersPage() {
  const { userId } = auth();
  const queryClient = new QueryClient();

  if (!userId) {
    redirect("/sign-in");
  }

  await queryClient.prefetchQuery({
    queryKey: ["user-filters", userId],
    queryFn: () => getFiltersWithItems(userId),
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MyFilters userId={userId} />
      </HydrationBoundary>
    </>
  );
}
