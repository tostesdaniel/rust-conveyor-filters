import Image from "next/image";
import Link from "next/link";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function FiltersSidebarHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link href='/' aria-label='Go to home page'>
            <div className='flex items-center gap-2'>
              <Image
                src='/logo.png'
                alt='Rust Conveyor Filters logo'
                width={36}
                height={36}
              />
              <div className='text-left font-brand font-bold'>
                <span className='sr-only'>Rust Conveyor Filters</span>
                <div
                  className='grid h-9 grid-cols-5 grid-rows-2 bg-linear-to-r from-[#53dbf2] via-[#ce9eec] to-[#3a7ff2] bg-clip-text leading-none text-transparent'
                  aria-hidden='true'
                >
                  <div className='col-span-1 row-span-full self-center'>
                    <div className='flex items-center gap-1'>
                      <span className='text-3xl leading-none tracking-tight'>
                        Rust
                      </span>
                      <span className='text-3xl leading-none'>\</span>
                    </div>
                  </div>
                  <div className='col-start-3 row-start-1 mt-[3px] -ml-1.5'>
                    <span className='text-base leading-none'>Conveyor</span>
                  </div>
                  <div className='col-start-3 row-start-2 -mt-[3px] ml-0.5'>
                    <span className='text-base leading-none'>Filters</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
