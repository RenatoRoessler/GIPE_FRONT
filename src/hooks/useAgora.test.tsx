import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAgora } from "./useAgora";

describe("useAgora", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-14T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("começa no instante atual e avança a cada intervalo", () => {
    const { result } = renderHook(() => useAgora(30_000));
    const inicio = result.current;
    act(() => vi.advanceTimersByTime(29_000));
    expect(result.current).toBe(inicio);
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(inicio + 30_000);
  });

  it("limpa o timer ao desmontar", () => {
    const { unmount } = renderHook(() => useAgora(1_000));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
