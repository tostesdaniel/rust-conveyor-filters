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

function setup(key: string | null = KEY) {
  return renderHook(
    ({ draftKey }) => {
      const form = useForm<Values>({ defaultValues: { name: "", tags: [] } });
      const { isDirty } = form.formState;
      return { form, isDirty, formDraft: useFormDraft(form, draftKey) };
    },
    { initialProps: { draftKey: key } },
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
});
