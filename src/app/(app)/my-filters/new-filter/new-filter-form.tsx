"use client";

import dynamic from "next/dynamic";
import { createFilterSchema } from "@/schemas/filterFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createFilter } from "@/actions/filterActions";
import { useGetCategories } from "@/hooks/use-get-categories";
import { useGetItems } from "@/hooks/use-get-items";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConveyorCard } from "@/components/conveyor-card";
import { FilterImageCombobox } from "@/components/filter-image-combobox";

const DevTool = dynamic(
  () => import("@hookform/devtools").then((module) => module.DevTool),
  { ssr: false },
);

export default function NewFilterForm() {
  const { data: items } = useGetItems();
  const { data: _categories } = useGetCategories();

  const form = useForm<z.infer<typeof createFilterSchema>>({
    resolver: zodResolver(createFilterSchema),
    defaultValues: {
      name: "",
      imagePath: "",
      description: "",
      items: [],
      isPublic: false,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: z.infer<typeof createFilterSchema>) {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("imagePath", data.imagePath);
    formData.append("items", JSON.stringify(data.items));
    formData.append("isPublic", String(data.isPublic));

    await createFilter(formData).then((res) => {
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 py-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Primitive weapons' {...field} />
              </FormControl>
              <FormDescription>
                Enter a name for your filter. This will be displayed to other
                users.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder='This filter is designed to have medications'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter a description for your filter. This will help others know
                what your filter is about.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='imagePath'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Cover Image</FormLabel>
              {items?.success && items.data && (
                <FilterImageCombobox field={field} items={items.data} />
              )}
              <FormDescription>
                Select an in-game item to represent your filter.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='items'
          render={() => (
            <FormItem>
              <FormLabel>Items</FormLabel>
              <FormDescription>
                Compose your conveyor by selecting items from the list.
              </FormDescription>
              <ConveyorCard />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Create Filter"}
        </Button>
      </form>
      {process.env.NODE_ENV === "development" && (
        <DevTool control={form.control as any} />
      )}
    </Form>
  );
}
