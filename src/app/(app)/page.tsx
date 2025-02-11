import { HeroBackground } from "@/components/landing-page/hero-background";
import { HeroContent } from "@/components/landing-page/hero-content";
import { HeroImage } from "@/components/landing-page/hero-image";
import { HeroStats } from "@/components/landing-page/hero-stats";

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
    </>
  );
}
