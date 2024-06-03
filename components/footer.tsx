import { siteConfig } from "@/app/config/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Icons } from "./ui/icons";

export function Footer() {
  return (
    <footer>
      <div className='mx-auto max-w-screen-2xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8'>
        <div className='flex justify-center space-x-6 md:order-2'>
          <Link href={siteConfig.links.gitHub} target='_blank' rel='noreferrer'>
            <div
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-9 px-0",
                "transition-colors hover:bg-transparent hover:text-foreground/85",
              )}
            >
              <Icons.gitHub className='h-5 w-5' />
              <span className='sr-only'>GitHub</span>
            </div>
          </Link>
        </div>
        <div className='mt-8 md:order-1 md:mt-0'>
          <p className='text-center text-xs leading-5'>
            &copy; 2024 {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
