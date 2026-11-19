import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CabecalhoDashboard, type CabecalhoDashboardProps } from "./CabecalhoDashboard";

function props(parcial: Partial<CabecalhoDashboardProps> = {}): CabecalhoDashboardProps {
  return {
    nome: "Everton Silva",
    agora: new Date(2026, 10, 19, 10, 42),
    atualizadoEm: new Date(2026, 10, 19, 10, 42),
    tipo: "dia",
    rotulo: "Hoje · 19 nov",
    podeVoltar: true,
    podeAvancar: false,
    mostrarVoltarParaHoje: false,
    onTipoChange: vi.fn(),
    onAnterior: vi.fn(),
    onProximo: vi.fn(),
    onVoltarParaHoje: vi.fn(),
    ...parcial,
  };
}

describe("CabecalhoDashboard", () => {
  it("saúda pelo primeiro nome, mostra a data por extenso e a hora da atualização", () => {
    renderWithTheme(<CabecalhoDashboard {...props()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Bom dia, Everton" })).toBeInTheDocument();
    expect(screen.getByText("Quinta, 19 de novembro · atualizado às 10:42")).toBeInTheDocument();
  });

  it("a saudação acompanha o horário e funciona sem nome", () => {
    const { rerender } = renderWithTheme(<CabecalhoDashboard {...props({ agora: new Date(2026, 10, 19, 15, 0) })} />);
    expect(screen.getByRole("heading", { level: 1, name: "Boa tarde, Everton" })).toBeInTheDocument();

    rerender(<CabecalhoDashboard {...props({ agora: new Date(2026, 10, 19, 21, 0), nome: "" })} />);
    expect(screen.getByRole("heading", { level: 1, name: "Boa noite" })).toBeInTheDocument();
  });

  it("antes da primeira resposta mostra só a data", () => {
    renderWithTheme(<CabecalhoDashboard {...props({ atualizadoEm: null })} />);

    expect(screen.getByText("Quinta, 19 de novembro")).toBeInTheDocument();
  });

  it("o seletor tem Dia, Semana e Mês, com o tipo atual marcado, e avisa a troca", async () => {
    const onTipoChange = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<CabecalhoDashboard {...props({ tipo: "semana", onTipoChange })} />);

    expect(screen.getAllByRole("tab").map((aba) => aba.textContent)).toEqual(["Dia", "Semana", "Mês"]);
    expect(screen.getByRole("tab", { name: "Semana" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "Mês" }));

    expect(onTipoChange).toHaveBeenCalledWith("mes");
  });

  it("as setas têm nome e avisam o clique", async () => {
    const onAnterior = vi.fn();
    const onProximo = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<CabecalhoDashboard {...props({ podeVoltar: true, podeAvancar: true, onAnterior, onProximo })} />);

    await user.click(screen.getByRole("button", { name: "Período anterior" }));
    await user.click(screen.getByRole("button", { name: "Próximo período" }));

    expect(onAnterior).toHaveBeenCalledTimes(1);
    expect(onProximo).toHaveBeenCalledTimes(1);
  });

  it("› fica desabilitada no período atual e ‹ no período do início do uso", async () => {
    const onProximo = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<CabecalhoDashboard {...props({ podeVoltar: false, podeAvancar: false, onProximo })} />);

    expect(screen.getByRole("button", { name: "Próximo período" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Período anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Próximo período" }));
    expect(onProximo).not.toHaveBeenCalled();
  });

  it("o rótulo do período é anunciado ao mudar (aria-live)", () => {
    renderWithTheme(<CabecalhoDashboard {...props({ rotulo: "Esta semana · 16 – 22 nov", tipo: "semana" })} />);

    expect(screen.getByText("Esta semana · 16 – 22 nov")).toHaveAttribute("aria-live", "polite");
  });

  it("Voltar para hoje só aparece fora do período atual e avisa o clique", async () => {
    const onVoltarParaHoje = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithTheme(<CabecalhoDashboard {...props({ mostrarVoltarParaHoje: false })} />);

    expect(screen.queryByRole("button", { name: "Voltar para hoje" })).not.toBeInTheDocument();

    rerender(<CabecalhoDashboard {...props({ mostrarVoltarParaHoje: true, onVoltarParaHoje })} />);
    await user.click(screen.getByRole("button", { name: "Voltar para hoje" }));

    expect(onVoltarParaHoje).toHaveBeenCalledTimes(1);
  });
});
