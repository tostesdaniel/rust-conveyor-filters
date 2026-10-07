import type { Metadata } from "next";
import { getItemIconRows } from "@/data/items";

import { Cta } from "@/components/pages/landing/cta";
import { FeaturesShowcase } from "@/components/pages/landing/features-showcase";
import { HeroBackground } from "@/components/pages/landing/hero-background";
import { HeroContent } from "@/components/pages/landing/hero-content";
import { HeroImage } from "@/components/pages/landing/hero-image";
import { HeroStats } from "@/components/pages/landing/hero-stats";
import {
  OutputContainersStrip,
  STRIP_CONTAINERS,
  STRIP_FEATURED_CONTAINER,
} from "@/components/pages/landing/output-containers-strip";
import { Testimonials } from "@/components/pages/landing/testimonials";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const icons = new Map(
    getItemIconRows([STRIP_FEATURED_CONTAINER, ...STRIP_CONTAINERS]).map(
      (row) => [row.shortname, row],
    ),
  );
  const furnace = icons.get(STRIP_FEATURED_CONTAINER);

  return (
    <>
      <div className='relative isolate overflow-hidden'>
        <HeroBackground />
        <div className='container mx-auto max-w-7xl pt-10 lg:flex lg:py-24'>
          <HeroContent furnace={furnace} />
          <HeroImage />
        </div>
      </div>

      <HeroStats />

      <OutputContainersStrip
        featured={furnace}
        containers={[...icons.values()].filter((row) => row !== furnace)}
      />

      <FeaturesShowcase icons={icons} />

      <Testimonials />

      <Cta />
    </>
  );
}
