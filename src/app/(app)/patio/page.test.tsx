import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn().mockReturnValue(new Promise(() => {})) }));
vi.mock("@/components/patio/useVagasPatio", () => ({ useVagasPatio: () => null }));
// Em produção o host dos modais vem do layout da área logada; aqui só a página é renderizada.
vi.mock("@/components/veiculos/VeiculoModais", () => ({ useVeiculoModais: () => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }) }));

import PatioPage from "./page";

describe("página do pátio", () => {
  it("mostra o título, a descrição e a tela do pátio", () => {
    renderWithProviders(<PatioPage />);

    expect(screen.getByText("Pátio")).toBeInTheDocument();
    expect(screen.getByText(/Veículos que estão no pátio agora/)).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando o pátio" })).toBeInTheDocument();
  });
});
