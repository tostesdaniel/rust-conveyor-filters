"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { UserRoundIcon } from "lucide-react";

export function UserMenu({
  ...props
}: React.ComponentProps<typeof UserButton>) {
  const { user } = useUser();

  if (!user) return null;

  return (
    <UserButton {...props}>
      <UserButton.MenuItems>
        <UserButton.Link
          label='Public Profile'
          labelIcon={<UserRoundIcon className='size-4' />}
          href={`/users/${user.username}`}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
