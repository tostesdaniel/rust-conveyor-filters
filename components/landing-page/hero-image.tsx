"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

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
    <div className='mx-auto mt-16 flex max-w-2xl lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32'>
      <div className='max-w-3xl flex-none sm:max-w-5xl lg:max-w-none'>
        <Image
          src={
            resolvedTheme === "dark"
              ? "/images/hero-dark.jpg"
              : "/images/hero-light.jpg"
          }
          alt='Conveyor filter creator interface'
          quality={100}
          width={1408}
          height={1024}
          sizes='1408px'
          className='w-[70rem] rounded-md shadow-2xl ring-1 ring-foreground/10'
        />
      </div>
    </div>
  );
}
