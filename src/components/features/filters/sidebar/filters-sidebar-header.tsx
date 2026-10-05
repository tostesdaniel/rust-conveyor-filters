import Link from "next/link";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";

export function FiltersSidebarHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          render={<Link href='/' aria-label='Go to home page' />}
        >
          <Logo className='text-[36px]' markClassName='h-[1em]! w-auto!' />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
