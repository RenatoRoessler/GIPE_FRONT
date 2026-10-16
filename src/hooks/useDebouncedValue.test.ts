import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("só propaga o valor depois do atraso", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: "a" },
    });
    expect(result.current).toBe("a");

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("ab");
  });

  it("reinicia o atraso a cada mudança", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: "1" },
    });
    rerender({ value: "12" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "123" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("1");
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("123");
  });
});
