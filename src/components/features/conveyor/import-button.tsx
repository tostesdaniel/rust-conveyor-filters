"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { type FieldValues, type UseFieldArrayReplace } from "react-hook-form";
import { z } from "zod";

import { MAX_FILTER_ITEMS } from "@/config/constants";
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

interface ImportButtonProps extends React.ComponentProps<typeof Button> {
  onImport: UseFieldArrayReplace<FieldValues, "items">;
}

const GameConveyorFilterItemSchema = z
  .array(
    z.object({
      TargetCategory: z.union([z.number(), z.null()]),
      MaxAmountInOutput: z.number(),
      BufferAmount: z.number(),
      MinAmountInInput: z.number(),
      IsBlueprint: z.boolean(),
      BufferTransferRemaining: z.number(),
      TargetItemName: z.string(),
    }),
  )
  .max(MAX_FILTER_ITEMS, "Too many items");

export function ImportButton({ onImport, ...props }: ImportButtonProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const data = e.clipboardData.getData("text/plain");

    try {
      const MAX_FILTER_ITEMS_JSON_SIZE = 16 * 1024; // 16KB
      const jsonSize = new TextEncoder().encode(data).length;
      if (jsonSize > MAX_FILTER_ITEMS_JSON_SIZE) {
        setError(
          `JSON data too large (${Math.round(jsonSize / 1024)}KB). Maximum allowed: 16KB`,
        );
        return;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (parseError) {
        setError("Invalid JSON format. Please check your JSON syntax.");
        return;
      }
      const result = GameConveyorFilterItemSchema.safeParse(parsedData);
      if (!result.success) {
        // Extract the most relevant error message
        const firstError = result.error.errors[0];
        if (firstError.message.includes("Too many items")) {
          setError(
            `Cannot import: Maximum ${MAX_FILTER_ITEMS} items allowed, got ${parsedData?.length || "unknown"} items`,
          );
        } else {
          setError(
            "Invalid JSON format: Please use a valid JSON exported from the game",
          );
        }
        return;
      }

      processValidatedData(result.data);
    } catch (error) {
      setError("An unexpected error occurred while processing the JSON");
      console.error("Import error:", error);
    }
  };

  const processValidatedData = (
    validatedData: z.infer<typeof GameConveyorFilterItemSchema>,
  ) => {
    const { data: items } = queryClient.getQueryData<{ data: Item[] }>([
      "items",
    ]) || { data: [] };
    const categories =
      queryClient.getQueryData<Category[]>(["categories"]) || [];

    const conveyorItems = validatedData.map((item) => {
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
        <Button type='button' variant='secondary' {...props}>
          <Upload />
          Import
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>
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
