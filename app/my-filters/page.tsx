import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FolderPlusIcon, PlusIcon } from "lucide-react";

import { getFiltersById } from "@/lib/queries";
import { HeadingWithAction } from "@/components/ui/heading-with-action";
import { Typography } from "@/components/ui/typography";
import { EmptyState } from "@/components/empty-state";
import { MyFilters as UserFilters } from "@/components/my-filters";

export default async function MyFilters() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const filters = await getFiltersById(userId);

  return (
    <>
      {filters?.length ? (
        <HeadingWithAction
          buttonLabel='New Filter'
          label='My Filters'
          redirectUrl='/my-filters/new-filter'
          variant='h1'
          ActionIcon={PlusIcon}
        />
      ) : (
        <Typography variant='h1'>New Filter</Typography>
      )}
      {filters?.length ? (
        <UserFilters filters={filters} />
      ) : (
        <EmptyState
          Icon={FolderPlusIcon}
          title='No filters'
          description='Get started by creating a new filter.'
          label='New Filter'
          ButtonIcon={PlusIcon}
          redirectUrl='/my-filters/new-filter'
        />
      )}
    </>
  );
}
