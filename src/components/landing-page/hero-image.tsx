"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { ThemeImage } from "@/components/theme-image";

export function HeroImage() {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme } = useTheme();

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
            width={1408}
            height={1024}
            className='ring-border/10 relative w-[70rem] rounded-md ring-1 shadow-2xl transition-transform duration-500 ease-in-out group-hover:scale-[1.02]'
          />
        </div>
      </div>
    </div>
  );
}
