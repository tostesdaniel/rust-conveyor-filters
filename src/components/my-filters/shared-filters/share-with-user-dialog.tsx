"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Check, ChevronsUpDown, Clock, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";

import { shareFilter } from "@/actions/sharedFilters";
import { validateToken } from "@/actions/shareTokens";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { cn } from "@/lib/utils";

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
  FormField,
  FormItem,
  FormMessage,
} from "../../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";

type RecentToken = {
  token: string;
  lastUsed: string;
};

const formSchema = z.object({
  filterId: z.coerce.number(),
  token: z
    .string()
    .nonempty("Token is required.")
    .length(21, "Token is invalid. Make sure the token is correct."),
});

interface ShareWithUserDialogProps {
  filterId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setIsDialogOpen: (open: boolean) => void;
}

export function ShareWithUserDialog({
  filterId,
  open,
  onOpenChange,
  setIsDialogOpen,
}: ShareWithUserDialogProps) {
  const [openCombobox, setOpenCombobox] = useState(false);
  const [recentTokens, setRecentTokens] = useLocalStorage<RecentToken[]>(
    "recent-share-tokens",
    [],
  );

  interface ShareMutationContext {
    isTokenValid: boolean;
  }

  const { mutateAsync: shareFilterMutationAsync, isPending } =
    useServerActionMutation(shareFilter, {
      onMutate: async (variables) => {
        const [data, error] = await validateToken({ token: variables.token });

        if (error || !data) {
          throw error;
        }

        return { isTokenValid: data.valid };
      },
      onSuccess: (_, variables, context) => {
        const mutationContext = context as ShareMutationContext;
        if (mutationContext.isTokenValid) {
          handleShareSuccess(variables.token);
          toast.success("Filter shared successfully");
        }
      },

      onError: (error, variables) => {
        const handleInvalidToken = () => {
          setRecentTokens((prev) => {
            const filtered = prev.filter((t) => t.token !== variables.token);
            return [...filtered].slice(0, 3);
          });
          form.setValue("token", "");
        };
        switch (error.code) {
          case "NOT_FOUND":
            toast.warning("Invalid token", {
              description: error.message,
            });
            handleInvalidToken();
            break;
          case "FORBIDDEN":
            toast.warning("Token revoked", {
              description: error.message,
            });
            handleInvalidToken();
            break;
          case "CONFLICT":
            toast.warning("Filter already shared with this user", {
              description: error.message,
            });
            break;
          case "INTERNAL_SERVER_ERROR":
            toast.error("Server error", {
              description: error.message,
            });
            break;
          default:
            toast.error("Something went wrong", {
              description:
                "Please try again. If the error persists, please contact support on Discord.",
            });
        }
      },
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
      filterId,
    },
  });

  useEffect(() => {
    if (open) {
      const mostRecentToken = recentTokens[0]?.token || "";

      form.reset({
        token: mostRecentToken,
        filterId,
      });
    }
  }, [filterId, form, open, recentTokens]);

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await shareFilterMutationAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[475px]'>
        <DialogHeader>
          <DialogTitle>Share Filter with User</DialogTitle>
          <DialogDescription>
            Share the filter with a user by entering their token.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
                            "w-full justify-between",
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
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className='w-(--radix-popover-trigger-width) p-0'>
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
              <Button type='submit' size='sm' disabled={isPending}>
                Share
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
