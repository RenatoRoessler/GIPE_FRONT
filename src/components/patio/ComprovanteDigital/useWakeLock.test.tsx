import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWakeLock } from "./useWakeLock";

function instalar(request: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });
}

function visibilidade(estado: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: estado });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useWakeLock", () => {
  beforeEach(() => {
    visibilidade("visible");
  });

  afterEach(() => {
    // @ts-expect-error remove o stub entre os testes
    delete navigator.wakeLock;
  });

  it("sem suporte não faz nada nem lança", () => {
    expect(() => renderHook(() => useWakeLock())).not.toThrow();
  });

  it("pede a tela acesa ao montar e solta ao desmontar", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release });
    instalar(request);

    const { unmount } = renderHook(() => useWakeLock());
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    await Promise.resolve();
    unmount();

    expect(release).toHaveBeenCalledTimes(1);
  });

  it("pede de novo quando a aba volta a ficar visível", async () => {
    const request = vi.fn().mockResolvedValue({ release: vi.fn().mockResolvedValue(undefined) });
    instalar(request);

    renderHook(() => useWakeLock());
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    visibilidade("hidden");
    expect(request).toHaveBeenCalledTimes(1);
    visibilidade("visible");
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it("recusa do navegador é engolida", async () => {
    const request = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    instalar(request);

    const { unmount } = renderHook(() => useWakeLock());
    await vi.waitFor(() => expect(request).toHaveBeenCalled());

    expect(() => unmount()).not.toThrow();
  });
});
