// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  returnToFilter,
  useScrollToReturnedFilter,
} from "./use-return-to-filter";

const scrollIntoView = vi.fn();
const animate = vi.fn();

function List({ ids }: { ids: number[] }) {
  useScrollToReturnedFilter();
  return (
    <ul>
      {ids.map((id) => (
        <li key={id} data-filter-id={id} />
      ))}
    </ul>
  );
}

function scrolledTo() {
  return scrollIntoView.mock.contexts.map((el) =>
    Number((el as HTMLElement).dataset.filterId),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  scrollIntoView.mockClear();
  animate.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
  Element.prototype.animate = animate;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useScrollToReturnedFilter", () => {
  it("does nothing without a pending filter", () => {
    render(<List ids={[1, 2]} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls to and highlights the card already on the page", () => {
    returnToFilter(2);
    render(<List ids={[1, 2]} />);
    expect(scrolledTo()).toEqual([2]);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it("waits for a card that renders later", async () => {
    returnToFilter(3);
    const { rerender } = render(<List ids={[1]} />);
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(<List ids={[1, 3]} />);
    await act(async () => {});
    expect(scrolledTo()).toEqual([3]);
  });

  it("only scrolls once per return", () => {
    returnToFilter(1);
    render(<List ids={[1]} />);
    render(<List ids={[1]} />);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("survives an effect re-run before the card appears", async () => {
    returnToFilter(4);
    const { rerender } = render(<List key='a' ids={[]} />);
    rerender(<List key='b' ids={[4]} />);
    await act(async () => {});
    expect(scrolledTo()).toEqual([4]);
  });

  it("ignores a return that is too old", () => {
    returnToFilter(1);
    vi.advanceTimersByTime(11_000);
    render(<List ids={[1]} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("gives up when the card never appears", async () => {
    returnToFilter(5);
    const { rerender } = render(<List ids={[]} />);
    vi.advanceTimersByTime(11_000);
    rerender(<List ids={[5]} />);
    await act(async () => {});
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
