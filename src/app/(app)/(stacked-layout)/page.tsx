import { CTA } from "@/components/pages/landing/cta";
import { FeaturesShowcase } from "@/components/pages/landing/features-showcase";
import { HeroBackground } from "@/components/pages/landing/hero-background";
import { HeroContent } from "@/components/pages/landing/hero-content";
import { HeroImage } from "@/components/pages/landing/hero-image";
import { HeroStats } from "@/components/pages/landing/hero-stats";
import { Testimonials } from "@/components/pages/landing/testimonials";

export default function HomePage() {
  return (
    <>
      <div className='relative isolate overflow-hidden'>
        <HeroBackground />
        <div className='container mx-auto max-w-7xl pt-10 lg:flex lg:py-24'>
          <HeroContent />
          <HeroImage />
        </div>
      </div>

      <HeroStats />

      <FeaturesShowcase />

      <Testimonials />

      <CTA />
    </>
  );
}
