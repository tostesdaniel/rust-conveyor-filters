// @vitest-environment jsdom
import { useFormDraftStore, type FormDraft } from "@/stores/form-drafts";
import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFormDraft } from "./use-form-draft";

interface Values {
  name: string;
  tags: string[];
}

const KEY = "test:new";
const DAY_MS = 24 * 60 * 60 * 1000;

interface Props {
  draftKey: string | null;
  extra?: unknown;
}

function setup(key: string | null = KEY, base?: string, extra?: unknown) {
  return renderHook(
    ({ draftKey, extra }: Props) => {
      const form = useForm<Values>({ defaultValues: { name: "", tags: [] } });
      const { isDirty } = form.formState;
      return {
        form,
        isDirty,
        formDraft: useFormDraft(form, draftKey, { base, extra }),
      };
    },
    { initialProps: { draftKey: key, extra } as Props },
  );
}

function storedDraft() {
  return useFormDraftStore.getState().drafts[KEY] as
    | FormDraft<Values>
    | undefined;
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useFormDraftStore.setState({ drafts: {} });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useFormDraft", () => {
  it("saves dirty values after the user stops typing", () => {
    const { result } = setup();

    act(() => {
      result.current.form.setValue("name", "Ore sorter", { shouldDirty: true });
    });
    expect(storedDraft()).toBeUndefined();

    act(() => vi.advanceTimersByTime(500));
    expect(storedDraft()?.values).toEqual({ name: "Ore sorter", tags: [] });
  });

  it("persists drafts to localStorage", () => {
    const { result } = setup();

    act(() => {
      result.current.form.setValue("name", "Ore sorter", { shouldDirty: true });
      vi.advanceTimersByTime(500);
    });

    const raw = JSON.parse(localStorage.getItem("form-drafts") ?? "{}");
    expect(raw.state.drafts[KEY].values.name).toBe("Ore sorter");
  });

  it("removes the draft once the form is back to its starting values", () => {
    const { result } = setup();

    act(() => {
      result.current.form.setValue("name", "Ore sorter", { shouldDirty: true });
      vi.advanceTimersByTime(500);
    });
    act(() => {
      result.current.form.setValue("name", "", { shouldDirty: true });
      vi.advanceTimersByTime(500);
    });

    expect(storedDraft()).toBeUndefined();
  });

  it("saves right away when the page is hidden", () => {
    const { result } = setup();

    act(() => {
      result.current.form.setValue("name", "Ore sorter", { shouldDirty: true });
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(storedDraft()?.values.name).toBe("Ore sorter");
  });

  it("offers a stored draft without touching it until the user decides", () => {
    useFormDraftStore.getState().saveDraft(KEY, { name: "Old", tags: ["a"] });
    const { result } = setup();

    expect(result.current.formDraft.draft?.values).toEqual({
      name: "Old",
      tags: ["a"],
    });

    act(() => {
      result.current.form.reset({ name: "", tags: [] });
      vi.advanceTimersByTime(500);
    });
    expect(storedDraft()?.values).toEqual({ name: "Old", tags: ["a"] });
  });

  it("restores the draft as dirty changes", () => {
    useFormDraftStore.getState().saveDraft(KEY, { name: "Old", tags: ["a"] });
    const { result } = setup();

    act(() => result.current.formDraft.restore());

    expect(result.current.formDraft.draft).toBeNull();
    expect(result.current.form.getValues()).toEqual({
      name: "Old",
      tags: ["a"],
    });
    expect(result.current.isDirty).toBe(true);
  });

  it("discard deletes the stored draft and resumes saving", () => {
    useFormDraftStore.getState().saveDraft(KEY, { name: "Old", tags: [] });
    const { result } = setup();

    act(() => result.current.formDraft.discard());
    expect(storedDraft()).toBeUndefined();

    act(() => {
      result.current.form.setValue("name", "New", { shouldDirty: true });
      vi.advanceTimersByTime(500);
    });
    expect(storedDraft()?.values.name).toBe("New");
  });

  it("clear drops a save that was still waiting", () => {
    const { result } = setup();

    act(() => {
      result.current.form.setValue("name", "Submitted", { shouldDirty: true });
      result.current.formDraft.clear();
      vi.advanceTimersByTime(500);
    });

    expect(storedDraft()).toBeUndefined();
  });

  it("ignores drafts older than a week", () => {
    useFormDraftStore.setState({
      drafts: {
        [KEY]: {
          values: { name: "Stale", tags: [] },
          savedAt: Date.now() - 8 * DAY_MS,
        },
      },
    });
    const { result } = setup();

    expect(result.current.formDraft.draft).toBeNull();
    expect(storedDraft()).toBeUndefined();
  });

  it("does nothing while the key is null", () => {
    useFormDraftStore.getState().saveDraft(KEY, { name: "Old", tags: [] });
    const { result } = setup(null);

    act(() => {
      result.current.form.setValue("name", "New", { shouldDirty: true });
      vi.advanceTimersByTime(500);
    });

    expect(result.current.formDraft.draft).toBeNull();
    expect(storedDraft()?.values.name).toBe("Old");
  });

  it("stores the base with the draft", () => {
    const { result } = setup(KEY, "v1");

    act(() => {
      result.current.form.setValue("name", "Ore sorter", { shouldDirty: true });
      vi.advanceTimersByTime(500);
    });

    expect(storedDraft()?.base).toBe("v1");
  });

  it("leaves another key's draft alone when the key changes", () => {
    const otherKey = "test:other";
    useFormDraftStore
      .getState()
      .saveDraft(otherKey, { name: "Other", tags: [] });
    const { result, rerender } = setup();

    act(() => {
      result.current.form.setValue("name", "Ore sorter", { shouldDirty: true });
    });
    rerender({ draftKey: otherKey });
    act(() => {
      result.current.form.reset({ name: "", tags: [] });
      vi.advanceTimersByTime(500);
    });

    expect(useFormDraftStore.getState().drafts[otherKey]?.values).toEqual({
      name: "Other",
      tags: [],
    });
    expect(result.current.formDraft.draft?.values).toEqual({
      name: "Other",
      tags: [],
    });
  });

  it("stores extra state with the draft", () => {
    const { result } = setup(KEY, undefined, { smelting: false });

    act(() => {
      result.current.form.setValue("name", "Ore sorter", { shouldDirty: true });
      vi.advanceTimersByTime(500);
    });

    expect(storedDraft()?.extra).toEqual({ smelting: false });
  });

  it("saves when only the extra state changes on a dirty form", () => {
    const { result, rerender } = setup(KEY, undefined, { smelting: true });

    act(() => {
      result.current.form.setValue("name", "Ore sorter", { shouldDirty: true });
      vi.advanceTimersByTime(500);
    });
    rerender({ draftKey: KEY, extra: { smelting: false } });
    act(() => vi.advanceTimersByTime(500));

    expect(storedDraft()?.extra).toEqual({ smelting: false });
  });

  it("does not save extra state alone while the form is clean", () => {
    const { rerender } = setup(KEY, undefined, { smelting: true });

    rerender({ draftKey: KEY, extra: { smelting: false } });
    act(() => vi.advanceTimersByTime(500));

    expect(storedDraft()).toBeUndefined();
  });
});
