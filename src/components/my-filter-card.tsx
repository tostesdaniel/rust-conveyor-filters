"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getR2ImageUrl } from "@/utils/r2-images";
import {
  CornerDownRight,
  Edit,
  EllipsisVertical,
  ListPlusIcon,
  Trash,
  Trash2,
} from "lucide-react";

import { type ConveyorFilter } from "@/types/filter";
import { useGetUserCategories } from "@/hooks/use-get-user-categories";
import ViewFilter from "@/components/filters/view-filter";
import { CategoryDropdownCheckbox } from "@/components/my-filters/categories/category-dropdown-checkbox";
import { ClearFilterCategory } from "@/components/my-filters/categories/clear-filter-category";
import { DeleteFilterForm } from "@/app/(app)/(stacked-layout)/my-filters/components/forms/delete-filter-form";

import { ExportConveyorFilter } from "./export-conveyor-filter";
import { DeleteSharedFilterDialog } from "./my-filters/shared-filters/delete-shared-filter-dialog";
import { PrivateShareDropdownItem } from "./my-filters/shared-filters/private-share-dropdown-item";
import { ShareWithUserDialog } from "./my-filters/shared-filters/share-with-user-dialog";
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
  isFilterShared?: boolean;
}

export function MyFilterCard({
  filter,
  isFilterShared = false,
}: MyFilterCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isRemoveSharedFilterDialogOpen, setIsRemoveSharedFilterDialogOpen] =
    useState(false);
  const { data: categories } = useGetUserCategories();

  return (
    <li className='col-span-1 flex min-w-[300px] overflow-hidden rounded-md shadow-xs'>
      <div className='flex w-16 shrink-0 items-center justify-center rounded-l-md border-2 border-foreground/70 bg-card p-1.5 text-sm font-medium text-card-foreground'>
        <Image
          src={getR2ImageUrl(filter.imagePath + ".webp", "medium")}
          alt='Collection image'
          width='64'
          height='64'
        />
      </div>
      <div className='flex flex-1 items-center justify-between overflow-hidden rounded-r-md border-2 border-l-0 border-card-foreground/70'>
        <div className='flex-1 overflow-hidden px-4 py-2 text-sm'>
          {isFilterShared ? (
            <p className='overflow-hidden font-medium text-ellipsis text-foreground/85 transition-colors hover:text-foreground'>
              {filter.name}
            </p>
          ) : (
            <Link
              href={`/my-filters/edit/${filter.id}`}
              className='block overflow-hidden font-medium text-ellipsis text-foreground/85 transition-colors hover:text-foreground'
            >
              {filter.name}
            </Link>
          )}
          <p className='text-muted-foreground'>{`${filter.filterItems.length} items`}</p>
        </div>
        <div className='flex items-center space-x-2 pr-2'>
          <div className='flex items-center space-x-4'>
            {isFilterShared && <ViewFilter filter={filter} variant='icon' />}
            <ExportConveyorFilter type='icon' filter={filter.filterItems} />
          </div>

          {isFilterShared && (
            <div>
              <DeleteSharedFilterDialog
                filterId={filter.id}
                open={isRemoveSharedFilterDialogOpen}
                onOpenChange={setIsRemoveSharedFilterDialogOpen}
              />

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
                    <DropdownMenuItem
                      onSelect={() => setIsRemoveSharedFilterDialogOpen(true)}
                      className='text-destructive'
                    >
                      <Trash />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {!isFilterShared && (
            <>
              <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete filter</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this filter? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <DeleteFilterForm
                    cardId={filter.id}
                    setOpen={setIsDeleteOpen}
                  />
                </AlertDialogContent>
              </AlertDialog>
              <ShareWithUserDialog
                filterId={filter.id}
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
                setIsDialogOpen={setIsShareDialogOpen}
              />

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
                        <Edit />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <ViewFilter filter={filter} variant='dropdown' />
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        disabled={categories?.length === 0}
                        className='data-disabled:pointer-events-none data-disabled:opacity-50'
                      >
                        <ListPlusIcon />
                        Assign to category
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {categories?.map((category) => (
                            <DropdownMenuGroup key={category.id}>
                              {/*  Main Categories */}
                              <CategoryDropdownCheckbox
                                key={category.id}
                                category={category}
                                filter={filter}
                              />

                              {/* Subcategories Submenu */}
                              {category.subCategories.length > 0 && (
                                <DropdownMenuSub defaultOpen>
                                  <DropdownMenuSubTrigger className='pl-8'>
                                    <CornerDownRight />
                                    <span>Subcategories</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {category.subCategories.map(
                                      (subCategory) => (
                                        <CategoryDropdownCheckbox
                                          key={subCategory.id}
                                          category={subCategory}
                                          filter={filter}
                                          isSubCategory
                                        />
                                      ),
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                              {category !==
                                categories[categories.length - 1] && (
                                <DropdownMenuSeparator />
                              )}
                            </DropdownMenuGroup>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    {/* Clear Category */}
                    <ClearFilterCategory
                      filter={filter}
                      isSubCategory={!!filter.subCategoryId}
                    />

                    <DropdownMenuSeparator />
                    <PrivateShareDropdownItem
                      filterId={filter.id}
                      setIsDialogOpen={setIsShareDialogOpen}
                    />
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
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
