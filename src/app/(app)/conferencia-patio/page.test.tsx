import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api/services/conferenciaPatio", () => ({
  obterAberta: vi.fn().mockReturnValue(new Promise(() => {})),
  obterResumo: vi.fn().mockReturnValue(new Promise(() => {})),
  iniciarConferencia: vi.fn(),
  lerPlaca: vi.fn(),
  marcarItem: vi.fn(),
  descartarSemEntrada: vi.fn(),
  finalizarConferencia: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/conferencia-patio",
  useSearchParams: () => new URLSearchParams(),
}));

import ConferenciaPatioPage from "./page";

describe("página da conferência de pátio", () => {
  it("mostra o título e o carregamento da conferência", () => {
    renderWithProviders(<ConferenciaPatioPage />);

    expect(screen.getByRole("heading", { name: "Conferência de pátio" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando a conferência" })).toBeInTheDocument();
  });
});
