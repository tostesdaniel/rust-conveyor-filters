// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CancelFilterFormButton } from "./cancel-filter-form-button";

describe("CancelFilterFormButton", () => {
  it("asks before discarding changes", async () => {
    const onLeave = vi.fn();
    render(<CancelFilterFormButton onLeave={onLeave} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("stays on the form when the user keeps editing", async () => {
    const onLeave = vi.fn();
    render(<CancelFilterFormButton onLeave={onLeave} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Keep editing" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("leaves after the user confirms", async () => {
    const onLeave = vi.fn();
    render(<CancelFilterFormButton onLeave={onLeave} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Discard changes" }),
    );

    expect(onLeave).toHaveBeenCalledOnce();
  });
});
