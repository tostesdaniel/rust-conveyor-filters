// @vitest-environment jsdom
import type * as React from "react";
import type { CreateFilterInput } from "@/schemas/filterFormSchema";
import { act, renderHook } from "@testing-library/react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import {
  OutputContainerSplitProvider,
  useOutputContainerSplit,
  type LoadedValues,
} from "./output-container-split";

vi.mock("sonner", () => ({ toast: vi.fn() }));

vi.mock("@/hooks/use-catalogue", () => {
  const resource = (id: number, shortname: string) => ({
    id,
    name: shortname,
    shortname,
    stackSize: 1000,
    itemType: "Generic",
    category: "Resources",
  });
  const items = [resource(1, "wood"), resource(2, "stones")];
  const catalogue = {
    byId: new Map(items.map((item) => [item.id, item])),
    byShortname: new Map(items.map((item) => [item.shortname, item])),
  };
  return { useCatalogue: () => catalogue };
});

const row = (itemId: number, max: number) => ({
  itemId,
  name: "",
  imagePath: "",
  max,
  buffer: 0,
  min: 0,
});
const wood = (max: number) => row(1, max);
const stones = (max: number) => row(2, max);

function values(items: CreateFilterInput["items"]): CreateFilterInput {
  return {
    name: "Remix",
    description: "",
    imagePath: "",
    category: { categoryId: null, subCategoryId: null },
    isPublic: false,
    outputContainer: "box.wooden.large",
    items,
  };
}

function setup(initial: LoadedValues) {
  let form!: UseFormReturn<CreateFilterInput>;
  let saved = initial;
  function Wrapper({ children }: { children: React.ReactNode }) {
    form = useForm<CreateFilterInput>({
      defaultValues: values(initial.items as CreateFilterInput["items"]),
    });
    return (
      <FormProvider {...form}>
        <OutputContainerSplitProvider
          saved={saved}
          perfectSmelting={false}
          onPerfectSmeltingChange={() => {}}
        >
          {children}
        </OutputContainerSplitProvider>
      </FormProvider>
    );
  }
  const hook = renderHook(() => useOutputContainerSplit(), {
    wrapper: Wrapper,
  });
  return {
    split: () => hook.result.current,
    form: () => form,
    load: (next: LoadedValues) => {
      saved = next;
      hook.rerender();
    },
  };
}

describe("OutputContainerSplitProvider", () => {
  it("seeds again from a restored draft, so Re-split treats its fitted rows as fitted", () => {
    const remix: LoadedValues = {
      outputContainer: "box.wooden.large",
      items: [wood(48000)],
    };
    const draft: LoadedValues = {
      outputContainer: "box.wooden.large",
      items: [wood(24000), stones(24000)],
    };
    const { split, form, load } = setup(remix);

    act(() => {
      form().reset(values(draft.items as CreateFilterInput["items"]));
    });
    load(draft);
    act(() => {
      form().setValue("items", [wood(24000)]);
    });
    act(() => {
      split().resplit();
    });

    expect(form().getValues("items.0.max")).toBe(48000);
  });
});
