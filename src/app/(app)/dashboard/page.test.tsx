import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

// Cada peça é testada à parte: aqui só interessa o que a Home mostra e a ordem dos botões.
vi.mock("@/components/layout/InstallPwaButton", () => ({ InstallPwaButton: () => null }));
vi.mock("@/components/home/DashboardContent", () => ({ DashboardContent: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/home/IndicadoresPatio", () => ({ IndicadoresPatio: () => null }));
vi.mock("@/components/veiculos/RegistrarEntradaButton", () => ({ RegistrarEntradaButton: () => <button type="button">Registrar entrada</button> }));
vi.mock("@/components/veiculos/RegistrarSaidaButton", () => ({ RegistrarSaidaButton: () => <button type="button">Registrar saída</button> }));
vi.mock("@/components/empresa/CartazTicket", () => ({ GerarCartazButton: () => <button type="button">Gerar Cartaz do Ticket</button> }));

vi.mock("@/components/onboarding", () => ({ RepetirTourButton: () => <button type="button">Repetir tour</button> }));

import DashboardPage from "./page";

describe("Home (dashboard)", () => {
  it("mostra Gerar Cartaz do Ticket e Repetir tour depois de Entrada e Saída", () => {
    renderWithProviders(<DashboardPage />);

    const botoes = screen.getAllByRole("button").map((botao) => botao.textContent);
    expect(botoes).toEqual(["Registrar entrada", "Registrar saída", "Gerar Cartaz do Ticket", "Repetir tour"]);
  });
});
