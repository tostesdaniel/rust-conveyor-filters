"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Check,
  ChevronsUpDown,
  Clock,
  KeyRound,
  TriangleAlert,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";

import { useGetUserCategoryHierarchy } from "@/hooks/use-get-user-category-hierarchy";
import { useShareFilterCategoryMutation } from "@/hooks/use-share-filter-category-mutation";
import { useShareFilterMutation } from "@/hooks/use-share-filter-mutation";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Typography } from "@/components/shared/typography";

import { Button } from "../../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../../ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";

type RecentToken = {
  token: string;
  lastUsed: string;
};

const formSchema = z.object({
  includeSubcategories: z.boolean().default(false).optional(),
  token: z
    .string()
    .nonempty("Token is required.")
    .length(21, "Token is invalid. Make sure the token is correct."),
});

interface ShareWithUserDialogProps {
  filterId?: number;
  categoryId?: number | null;
  subCategoryId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setIsDialogOpen: (open: boolean) => void;
}

export function ShareWithUserDialog({
  filterId,
  categoryId,
  subCategoryId,
  open,
  onOpenChange,
  setIsDialogOpen,
}: ShareWithUserDialogProps) {
  const [openCombobox, setOpenCombobox] = useState(false);
  const [recentTokens, setRecentTokens] = useLocalStorage<RecentToken[]>(
    "recent-share-tokens",
    [],
  );
  const { data: userCategoryHierarchy = [] } = useGetUserCategoryHierarchy();

  const handleShareSuccess = (token: string) => {
    setRecentTokens((prev) => {
      const filtered = prev.filter((t) => t.token !== token);
      return [{ token, lastUsed: new Date().toISOString() }, ...filtered].slice(
        0,
        3,
      );
    });
    setIsDialogOpen(false);
  };

  const handleInvalidToken = (token: string) => {
    setRecentTokens((prev) => {
      const filtered = prev.filter((t) => t.token !== token);
      return [...filtered].slice(0, 3);
    });
    form.setValue("token", "");
  };

  const shareFilterMutation = useShareFilterMutation({
    onShareSuccess: handleShareSuccess,
    onTokenInvalid: handleInvalidToken,
  });
  const shareFilterCategoryMutation = useShareFilterCategoryMutation({
    onShareSuccess: handleShareSuccess,
    onTokenInvalid: handleInvalidToken,
  });
  const isPending =
    shareFilterMutation.isPending || shareFilterCategoryMutation.isPending;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
    },
  });

  useEffect(() => {
    if (open) {
      const mostRecentToken = recentTokens[0]?.token || "";

      form.reset({
        token: mostRecentToken,
      });
    }
  }, [categoryId, filterId, form, open, recentTokens, subCategoryId]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (filterId) {
        await shareFilterMutation.mutateAsync({
          token: data.token,
          filterId,
        });
      } else {
        await shareFilterCategoryMutation.mutateAsync({
          token: data.token,
          categoryId: categoryId ?? null,
          subCategoryId,
          includeSubcategories: data.includeSubcategories ?? false,
        });
      }
    } catch (error) {
      // Error is handled in the mutation hook
    }
  };

  const getShareText = () => {
    const getBaseDescription = (s: string, plural: boolean = false) =>
      `Share ${plural ? "these" : "this"} ${s} with a user by entering their token.`;
    if (filterId)
      return {
        title: "Share Filter",
        description: getBaseDescription("filter"),
      };
    if (subCategoryId)
      return {
        title: "Share Subcategory",
        description: getBaseDescription("subcategory"),
      };
    if (categoryId)
      return {
        title: "Share Category",
        description: getBaseDescription("category"),
      };
    return {
      title: "Share Filters",
      description: getBaseDescription("filters", true),
    };
  };

  const showIncludeSubcategories = Boolean(
    categoryId &&
      userCategoryHierarchy?.find((e) => e.id === categoryId)?.subCategories
        .length,
  );
  const disableIncludeSubcategoriesCheckbox = userCategoryHierarchy
    ?.find((e) => e.id === categoryId)
    ?.subCategories.every((sc) => sc.filters.length === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[475px]'>
        <DialogHeader>
          <DialogTitle>{getShareText().title}</DialogTitle>
          <DialogDescription className='space-y-2'>
            <strong>To share:</strong> Ask your friend for their personal token
            (found in their{" "}
            <Typography variant='inlineCode' className='text-xs'>
              &quot;Shared With You&quot;
            </Typography>{" "}
            tab) and enter it below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {showIncludeSubcategories && (
              <FormField
                control={form.control}
                name='includeSubcategories'
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      "flex items-start space-y-0 space-x-3 rounded-md border p-4",
                      disableIncludeSubcategoriesCheckbox && "opacity-50",
                    )}
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={disableIncludeSubcategoriesCheckbox}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Include Subcategories</FormLabel>
                      <FormDescription>
                        If checked, all subcategories of this category will be
                        shared with the user.
                      </FormDescription>
                      {disableIncludeSubcategoriesCheckbox && (
                        <div className='mt-2 -ml-7 flex items-center gap-x-2 text-destructive brightness-150 saturate-150'>
                          <TriangleAlert className='h-4 w-4' />
                          <p className='text-sm font-medium'>
                            Add filters to subcategories to enable this option.
                          </p>
                        </div>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name='token'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          role='combobox'
                          aria-expanded={openCombobox}
                          className={cn(
                            "w-[425px] justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                          disabled={isPending}
                        >
                          {field.value ? (
                            <div className='flex items-center'>
                              <KeyRound className='mr-2 size-4 opacity-50' />
                              {field.value}
                            </div>
                          ) : (
                            "Enter or select a token..."
                          )}
                          <ChevronsUpDown />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className='w-[425px] p-0'>
                      <Command>
                        <CommandInput
                          placeholder='Enter token...'
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                          value={field.value}
                        />
                        {recentTokens.length > 0 ? (
                          <>
                            <CommandEmpty>No tokens found</CommandEmpty>
                            <CommandGroup heading='Recent Tokens'>
                              {recentTokens.map((item) => (
                                <CommandItem
                                  key={item.token}
                                  value={item.token}
                                  onSelect={() => {
                                    form.setValue("token", item.token);
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <div className='flex w-full items-center justify-between'>
                                    <div className='flex items-center'>
                                      <Clock className='mr-2 h-4 w-4 text-muted-foreground' />
                                      <span>{item.token}</span>
                                    </div>
                                    <span className='text-sm text-muted-foreground'>
                                      {format(
                                        new Date(item.lastUsed),
                                        "MMM d, yyyy",
                                      )}
                                    </span>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      field.value === item.token
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        ) : (
                          <CommandGroup heading='Recent Tokens'>
                            <CommandItem disabled className='opacity-50'>
                              <div className='flex items-center gap-x-2'>
                                <Clock className='h-4 w-4 text-muted-foreground' />
                                <span className='text-sm text-muted-foreground'>
                                  Your recently used tokens will be saved here
                                </span>
                              </div>
                            </CommandItem>
                          </CommandGroup>
                        )}
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='submit' disabled={isPending}>
                Share
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
