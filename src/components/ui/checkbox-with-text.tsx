"use client";

import * as React from "react";

import { Checkbox } from "./checkbox";
import { FormControl, FormDescription, FormItem, FormLabel } from "./form";

interface CheckBoxWithDescriptionProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: React.ReactNode;
}

export function CheckboxWithDescription({
  checked,
  onCheckedChange,
  label,
  description,
}: CheckBoxWithDescriptionProps) {
  return (
    <FormItem className='flex items-center space-y-0 '>
      <FormControl>
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      </FormControl>
      <FormLabel>{label}</FormLabel>
      {description && <FormDescription>{description}</FormDescription>}
    </FormItem>
  );
}
