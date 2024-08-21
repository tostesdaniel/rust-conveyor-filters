"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit, EllipsisVertical, ListPlusIcon, Trash2 } from "lucide-react";

import { type ConveyorFilter } from "@/types/filter";
import { useGetUserCategories } from "@/hooks/use-get-user-categories";
import ViewFilter from "@/components/filters/view-filter";
import { CategoryDropdownCheckbox } from "@/components/my-filters/categories/category-dropdown-checkbox";
import { ClearFilterCategory } from "@/components/my-filters/categories/clear-filter-category";
import { DeleteFilterForm } from "@/app/(app)/my-filters/components/forms/delete-filter-form";

import { ExportConveyorFilter } from "./export-conveyor-filter";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MyFilterCardProps {
  filter: ConveyorFilter;
}

export function MyFilterCard({ filter }: MyFilterCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { data: categories } = useGetUserCategories();

  return (
    <li className='col-span-1 flex min-w-[300px] rounded-md shadow-sm'>
      <div className='flex w-16 shrink-0 items-center justify-center rounded-l-md border-2 border-foreground/70 bg-card p-1.5 text-sm font-medium text-card-foreground'>
        <Image
          src={`/items/${filter.imagePath}.png`}
          alt='Collection image'
          width='64'
          height='64'
        />
      </div>
      <div className='flex flex-1 items-center justify-between rounded-r-md border-2 border-l-0 border-card-foreground/70'>
        <div className='flex-1 px-4 py-2 text-sm'>
          <Link
            href={`/my-filters/edit/${filter.id}`}
            className='font-medium text-foreground/85 transition-colors hover:text-foreground'
          >
            {filter.name}
          </Link>
          <p className='text-muted-foreground'>{`${filter.filterItems.length} items`}</p>
        </div>
        <div className='pr-2'>
          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete filter</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this filter? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <DeleteFilterForm cardId={filter.id} setOpen={setIsDeleteOpen} />
            </AlertDialogContent>
          </AlertDialog>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
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
                  <Link href={`/my-filters/edit/${filter.id}`}>
                    <Edit className='mr-2 h-4 w-4' />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <ViewFilter filter={filter} variant='dropdown' />
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    disabled={categories?.length === 0}
                    className='data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                  >
                    <ListPlusIcon className='mr-2 h-4 w-4' />
                    Assign to category
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {categories?.map((category) => (
                        <CategoryDropdownCheckbox
                          key={category.id}
                          category={category}
                          filter={filter}
                        />
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <ClearFilterCategory filter={filter} />
                <DropdownMenuSeparator />
                <ExportConveyorFilter
                  type='dropdown'
                  filter={filter.filterItems}
                />
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setIsDeleteOpen(true)}
                className='text-destructive'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}
