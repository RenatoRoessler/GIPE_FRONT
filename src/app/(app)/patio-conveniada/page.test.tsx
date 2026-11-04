import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api/services/patioConveniada", () => ({
  listarPatioConveniada: vi.fn().mockReturnValue(new Promise(() => {})),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/patio-conveniada",
  useSearchParams: () => new URLSearchParams(),
}));

import Page, { metadata } from "./page";

describe("página do pátio da conveniada", () => {
  it("mostra o título e o carregamento da lista", () => {
    renderWithProviders(<Page />);

    expect(screen.getByRole("heading", { level: 1, name: "Pátio" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando o pátio" })).toBeInTheDocument();
  });

  it("define o título da aba", () => {
    expect(metadata.title).toBe("Pátio — Murel");
  });
});
