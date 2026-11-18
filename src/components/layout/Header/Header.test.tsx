import { createEvent, fireEvent, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => ({ user: { name: "Ana" }, isLoading: false }) }));
vi.mock("@/contexts/ThemeModeContext", () => ({ useThemeMode: () => ({ mode: "dark", toggleThemeMode: vi.fn() }) }));
vi.mock("@/components/layout/InstallPwaButton", () => ({ InstallPwaButton: () => null }));
vi.mock("@/components/layout/UserMenu", () => ({ UserMenu: () => null }));

import { Header } from "./Header";

let quadros: FrameRequestCallback[];

beforeEach(() => {
  quadros = [];
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    quadros.push(callback);
    return quadros.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function clicar(link: HTMLElement) {
  const evento = createEvent.click(link);
  fireEvent(link, evento);
  return evento.defaultPrevented;
}

describe("Header: logo animado", () => {
  it("o link continua levando ao início, com o mesmo nome", () => {
    renderWithTheme(<Header />);

    expect(screen.getByRole("link", { name: "Murel — ir para o início" })).toHaveAttribute("href", "/");
  });

  it("durante a animação o clique só para; o clique seguinte navega", () => {
    renderWithTheme(<Header />);
    const link = screen.getByRole("link", { name: "Murel — ir para o início" });

    expect(quadros.length).toBeGreaterThan(0);
    expect(clicar(link)).toBe(true);
    expect(clicar(link)).toBe(false);
  });

  it("o foco no link para a animação, e Enter (clique) navega", () => {
    renderWithTheme(<Header />);
    const link = screen.getByRole("link", { name: "Murel — ir para o início" });

    fireEvent.focus(link);
    expect(clicar(link)).toBe(false);
  });

  it("passar o mouse para a animação; toque não para antes do clique", () => {
    renderWithTheme(<Header />);
    const link = screen.getByRole("link", { name: "Murel — ir para o início" });

    fireEvent.pointerEnter(link, { pointerType: "touch" });
    fireEvent.pointerDown(link, { pointerType: "touch" });
    expect(clicar(link)).toBe(true);
  });

  it("com o mouse sobre o link, o clique navega direto", () => {
    renderWithTheme(<Header />);
    const link = screen.getByRole("link", { name: "Murel — ir para o início" });

    fireEvent.pointerEnter(link, { pointerType: "mouse" });
    expect(clicar(link)).toBe(false);
  });
});
