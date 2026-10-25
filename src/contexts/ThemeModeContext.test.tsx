import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeModeProvider, useThemeMode } from "./ThemeModeContext";

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeModeProvider>{children}</ThemeModeProvider>;
}

describe("ThemeModeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("começa no tema claro quando nada foi salvo", () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    expect(result.current.mode).toBe("light");
  });

  it("mantém a preferência salva com o nome anterior do sistema", () => {
    window.localStorage.setItem("gipe-theme-mode", "dark");
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    expect(result.current.mode).toBe("dark");
  });

  it("prefere a chave nova à antiga", () => {
    window.localStorage.setItem("gipe-theme-mode", "dark");
    window.localStorage.setItem("murel-theme-mode", "light");
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    expect(result.current.mode).toBe("light");
  });

  it("alterna o tema e grava só a chave nova", () => {
    window.localStorage.setItem("gipe-theme-mode", "light");
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    act(() => result.current.toggleThemeMode());
    expect(result.current.mode).toBe("dark");
    expect(window.localStorage.getItem("murel-theme-mode")).toBe("dark");
  });

});
