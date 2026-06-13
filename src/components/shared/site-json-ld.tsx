import type { Graph, SearchAction } from "schema-dts";

import { siteConfig } from "@/config/site";

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;
const SOFTWARE_ID = `${siteConfig.url}/#software`;

export function SiteJsonLd() {
  const graph: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.webp`,
        sameAs: [
          siteConfig.links.gitHub,
          siteConfig.links.discord,
          siteConfig.links.linkedIn,
          siteConfig.links.steam,
        ],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: { "@id": ORGANIZATION_ID },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/filters?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        } as SearchAction,
      },
      {
        "@type": "SoftwareApplication",
        "@id": SOFTWARE_ID,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        publisher: { "@id": ORGANIZATION_ID },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
