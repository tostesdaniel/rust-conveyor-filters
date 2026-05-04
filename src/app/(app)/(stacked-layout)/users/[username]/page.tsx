import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCreatorPublicStats,
  getPublicFilterHierarchyForAuthor,
} from "@/data/creator-public";
import { api, HydrateClient } from "@/trpc/server";
import { clerkUserToAuthorDisplay } from "@/utils/enrich-filter";

import { siteConfig } from "@/config/site";
import { findClerkUserByUsername } from "@/lib/public-creator";
import {
  librarySynopsisLine,
  summarizeCreatorLibrary,
} from "@/components/features/creator-profile/creator-library-summary";
import { CreatorProfileJsonLd } from "@/components/features/creator-profile/creator-profile-json-ld";
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
  const nf = new Intl.NumberFormat("en-US");
  const [stats, hierarchy] = await Promise.all([
    getCreatorPublicStats(user.id),
    getPublicFilterHierarchyForAuthor(user.id),
  ]);
  const summary = summarizeCreatorLibrary(hierarchy);
  const synopsis = librarySynopsisLine(stats.publicFilterCount, summary);

  let description = `Browse public conveyor filters by ${display} (@${user.username}).`;
  if (stats.publicFilterCount > 0) {
    description += ` ${nf.format(stats.publicFilterCount)} public filters, ${nf.format(stats.totalViews)} views.`;
    if (synopsis) {
      description += ` ${synopsis}`;
    }
  } else {
    description += " No public filters yet.";
  }

  const canonical = `${siteConfig.url}/users/${user.username}`;
  const title = `${display} — Public filters`;

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [
      "Rust conveyor filters",
      "Rust",
      user.username,
      ...(display !== user.username ? [display] : []),
    ],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "profile",
      url: canonical,
      title,
      description,
      siteName: siteConfig.name,
      username: user.username,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  const displayName = clerkUserToAuthorDisplay(user);

  return (
    <>
      <CreatorProfileJsonLd user={user} displayName={displayName} />
      <HydrateClient>
        <CreatorProfileView username={user.username} />
      </HydrateClient>
    </>
  );
}
