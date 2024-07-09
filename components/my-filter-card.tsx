import Image from "next/image";
import Link from "next/link";
import { Edit, EllipsisVertical } from "lucide-react";

import { FilterWithItemsAndInfo } from "@/types/filter";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MyFilterCardProps {
  filter: FilterWithItemsAndInfo;
}

export async function MyFilterCard({ filter }: MyFilterCardProps) {
  return (
    <li className='col-span-1 flex rounded-md shadow-sm'>
      <div className='flex w-16 shrink-0 items-center justify-center rounded-l-md border-2 border-foreground/70 bg-card p-1.5 text-sm font-medium text-card-foreground'>
        <Image
          src={`/items/${filter.imagePath}.png`}
          alt='Collection image'
          width='64'
          height='64'
        />
      </div>
      <div className='flex flex-1 items-center justify-between rounded-r-md border-b border-r border-t border-card-foreground/70'>
        <div className='flex-1 px-4 py-2 text-sm'>
          <Link
            href={filter.id.toString()}
            className='font-medium text-foreground/85 transition-colors hover:text-foreground'
          >
            {filter.name}
          </Link>
          <p className='text-muted-foreground'>{`${filter.filterItems.length} items`}</p>
        </div>
        <div className='pr-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 shrink-0 rounded-full'
              >
                <span className='sr-only'>Open options</span>
                <EllipsisVertical className='h-5 w-5' aria-hidden='true' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={`/my-filters/${filter.id}/edit`}>
                      <Edit className='mr-2 h-4 w-4' />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Export</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}
