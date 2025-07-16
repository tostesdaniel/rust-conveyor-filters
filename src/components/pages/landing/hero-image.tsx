"use client";

import * as React from "react";

import { ThemeImage } from "@/components/shared/theme-image";

export function HeroImage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className='mx-auto mt-16 flex max-w-2xl lg:mt-0 lg:mr-0 lg:ml-10 lg:max-w-none lg:flex-none xl:ml-32'>
      <div className='max-w-3xl flex-none sm:max-w-5xl lg:max-w-none'>
        <div className='group relative'>
          <div className='absolute -inset-px rounded-md bg-gradient-to-r from-[#4361ee] to-[#4cc9f0] blur transition-transform duration-500 ease-in-out group-hover:scale-[1.04]' />

          <ThemeImage
            srcLight='/images/hero-light.webp'
            srcDark='/images/hero-dark.webp'
            alt='Conveyor filter creator interface'
            quality={100}
            fetchPriority='high'
            width={1408}
            height={1024}
            className='relative w-[70rem] rounded-md shadow-2xl ring-1 ring-border/10 transition-transform duration-500 ease-in-out group-hover:scale-[1.02]'
          />
        </div>
      </div>
    </div>
  );
}
