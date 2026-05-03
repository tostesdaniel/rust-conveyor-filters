import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, HydrateClient } from "@/trpc/server";
import { clerkUserToAuthorDisplay } from "@/utils/enrich-filter";

import { findClerkUserByUsername } from "@/lib/public-creator";
import { CreatorProfileView } from "@/components/features/creator-profile/creator-profile-view";

type CreatorProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: CreatorProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const user = await findClerkUserByUsername(decoded);
  if (!user?.username) {
    return { title: "User not found" };
  }
  const display = clerkUserToAuthorDisplay(user) ?? user.username;
  return {
    title: `${display} — Public filters`,
    description: `Browse public conveyor filters by ${display} (@${user.username}).`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CreatorPublicProfilePage({
  params,
}: CreatorProfilePageProps) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const user = await findClerkUserByUsername(decoded);
  if (!user?.username) {
    notFound();
  }

  await api.creator.getPublicProfile.prefetch({
    username: user.username,
  });

  return (
    <HydrateClient>
      <CreatorProfileView username={user.username} />
    </HydrateClient>
  );
}
