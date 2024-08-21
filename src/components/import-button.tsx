"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { type FieldValues, type UseFieldArrayReplace } from "react-hook-form";
import { z } from "zod";

import { type Category, type Item } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ImportButtonProps {
  onImport: UseFieldArrayReplace<FieldValues, "items">;
}

const GameConveyorFilterItemSchema = z.array(
  z.object({
    TargetCategory: z.union([z.number(), z.null()]),
    MaxAmountInOutput: z.number(),
    BufferAmount: z.number(),
    MinAmountInInput: z.number(),
    IsBlueprint: z.boolean(),
    BufferTransferRemaining: z.number(),
    TargetItemName: z.string(),
  }),
);

export function ImportButton({ onImport }: ImportButtonProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const data = e.clipboardData.getData("text/plain");
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (err) {
      setError("Invalid JSON format");
      return;
    }
    const result = GameConveyorFilterItemSchema.safeParse(parsedData);
    if (result.success) {
      const { data: items } = queryClient.getQueryData<{ data: Item[] }>([
        "items",
      ]) || { data: [] };
      const categories =
        queryClient.getQueryData<Category[]>(["categories"]) || [];

      const conveyorItems = result.data.map((item) => {
        const matchedItem = items.find(
          (i) => i.shortname === item.TargetItemName,
        );
        const matchedCategory = categories.find(
          (c) => c.id === item.TargetCategory,
        );

        if (matchedItem) {
          return {
            itemId: matchedItem.id,
            categoryId: null,
            name: matchedItem.name,
            shortname: matchedItem.shortname,
            category: matchedItem.category,
            imagePath: matchedItem.imagePath,
            max: item.MaxAmountInOutput,
            buffer: item.BufferAmount,
            min: item.MinAmountInInput,
          };
        } else if (matchedCategory) {
          return {
            itemId: null,
            categoryId: matchedCategory.id,
            name: matchedCategory.name,
            max: item.MaxAmountInOutput,
            buffer: item.BufferAmount,
            min: item.MinAmountInInput,
          };
        }
      });
      setError(null);
      onImport(conveyorItems);
      setOpen(false);
    } else {
      setError(
        `Invalid JSON format: Please use a valid JSON exported in the game`,
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setError(null);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (open) setError(null);
      }}
    >
      <PopoverTrigger asChild>
        <Button type='button' variant='secondary' size='sm'>
          <Upload className='mr-2 h-4 w-4' />
          Import
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='font-medium leading-none'>
              Import existing conveyor
            </h4>
            <p className='text-sm text-muted-foreground'>
              Paste JSON to import your filters.
            </p>
          </div>
          <div>
            <Label htmlFor='filters' className='sr-only'>
              Filters
            </Label>
            <Input
              id='filters'
              placeholder='JSON goes here'
              onChange={handleChange}
              onPaste={handlePaste}
            />
            {error && <FormMessage className='mt-2'>{error}</FormMessage>}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
