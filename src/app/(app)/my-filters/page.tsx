import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { MyFilters } from "@/components/my-filters";

export default async function MyFiltersPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <>
      <MyFilters />
    </>
  );
}
