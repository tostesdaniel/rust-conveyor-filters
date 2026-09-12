import type { User } from "@clerk/nextjs/server";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";

type CreatorProfileJsonLdProps = {
  user: User;
  displayName: string | null;
};

export function CreatorProfileJsonLd({
  user,
  displayName,
}: CreatorProfileJsonLdProps) {
  const username = user.username;
  if (!username) {
    return null;
  }

  const canonical = `${siteConfig.url}/users/${username}`;
  const name = displayName ?? username;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonical,
    mainEntity: {
      "@type": "Person",
      name,
      url: canonical,
      image: user.imageUrl,
      identifier: `@${username}`,
    },
  };

  return <JsonLd data={jsonLd} />;
}
