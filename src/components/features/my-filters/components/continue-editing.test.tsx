// @vitest-environment jsdom
import { useFormDraftStore } from "@/stores/form-drafts";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContinueEditing } from "./continue-editing";

const USER = "user_1";
const MINUTE = 60 * 1000;

const mocks = vi.hoisted(() => ({
  filters: [] as { id: number; name: string }[] | undefined,
  toast: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ userId: USER }) }));
vi.mock("@/hooks/use-get-user-filters", () => ({
  useGetUserFilters: () => ({ data: mocks.filters }),
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));

function values(name: string) {
  return {
    name,
    description: "",
    imagePath: "",
    category: { categoryId: null, subCategoryId: null },
    items: [],
  };
}

function seed(drafts: Record<string, { name: string; ago: number }>) {
  useFormDraftStore.setState({
    drafts: Object.fromEntries(
      Object.entries(drafts).map(([key, { name, ago }]) => [
        key,
        { values: values(name), savedAt: Date.now() - ago },
      ]),
    ),
  });
}

beforeEach(() => {
  localStorage.clear();
  useFormDraftStore.setState({ drafts: {} });
  mocks.filters = [{ id: 7, name: "Saved ores" }];
  mocks.toast.mockReset();
});

describe("ContinueEditing", () => {
  it("renders nothing without drafts", () => {
    const { container } = render(<ContinueEditing />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists drafts newest first with links back to their forms", () => {
    seed({
      [`filter:${USER}:new`]: { name: "Sulfur line", ago: 30 * MINUTE },
      [`filter:${USER}:edit:7`]: { name: "Renamed ores", ago: 2 * MINUTE },
    });
    render(<ContinueEditing />);

    const links = screen.getAllByRole("link", { name: "Continue" });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/my-filters/edit/7?draft=restore",
      "/my-filters/new-filter?draft=restore",
    ]);
    expect(screen.getByText("Saved ores")).toBeInTheDocument();
    expect(screen.getByText("Sulfur line")).toBeInTheDocument();
  });

  it("ignores drafts from other users and forms", () => {
    seed({
      [`filter:user_2:new`]: { name: "Not mine", ago: MINUTE },
      [`feedback:${USER}`]: { name: "Feedback", ago: MINUTE },
    });
    const { container } = render(<ContinueEditing />);

    expect(container).toBeEmptyDOMElement();
  });

  it("drops edit drafts for filters that no longer exist", () => {
    seed({ [`filter:${USER}:edit:99`]: { name: "Deleted", ago: MINUTE } });
    render(<ContinueEditing />);

    expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
    expect(useFormDraftStore.getState().drafts).toEqual({});
  });

  it("names untitled new drafts", () => {
    seed({ [`filter:${USER}:new`]: { name: "  ", ago: MINUTE } });
    render(<ContinueEditing />);

    expect(screen.getByText("Untitled filter")).toBeInTheDocument();
  });

  it("discards a draft with an undo", () => {
    seed({ [`filter:${USER}:new`]: { name: "Sulfur line", ago: MINUTE } });
    render(<ContinueEditing />);

    fireEvent.click(
      screen.getByRole("button", { name: "Discard draft for Sulfur line" }),
    );
    expect(screen.queryByText("Sulfur line")).not.toBeInTheDocument();

    const [, options] = mocks.toast.mock.calls[0];
    act(() => options.action.onClick());
    expect(screen.getByText("Sulfur line")).toBeInTheDocument();
  });
});
