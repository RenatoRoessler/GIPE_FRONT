import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { Servico } from "@/types/servico";
import { ServicoOpcao } from "./ServicoOpcao";

const servico: Servico = {
  id: 7,
  nome: "Lavagem simples",
  descricao: "Externa",
  duracaoMinutos: 40,
  tempoPermitidoMinutos: null,
  ativo: true,
  precos: [],
};

describe("ServicoOpcao", () => {
  it("mostra nome, descrição, duração natural e preço", () => {
    renderWithProviders(<ServicoOpcao servico={servico} precoCentavos={3000} marcado={false} onAlternar={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: /Lavagem simples/ })).not.toBeChecked();
    expect(screen.getByText("Externa · cerca de 40 min")).toBeInTheDocument();
    expect(screen.getByText("R$ 30,00")).toBeInTheDocument();
  });

  it("mostra Grátis quando o valor é zero", () => {
    renderWithProviders(<ServicoOpcao servico={servico} precoCentavos={0} marcado={false} onAlternar={vi.fn()} />);
    expect(screen.getByText("Grátis")).toBeInTheDocument();
  });

  it("alterna ao tocar e reflete o estado marcado", async () => {
    const onAlternar = vi.fn();
    renderWithProviders(<ServicoOpcao servico={servico} precoCentavos={3000} marcado={false} onAlternar={onAlternar} />);

    await userEvent.click(screen.getByRole("checkbox"));
    expect(onAlternar).toHaveBeenCalledWith(7, true);
  });

  it("com a seleção marcada, o campo vem marcado", () => {
    renderWithProviders(<ServicoOpcao servico={servico} precoCentavos={3000} marcado onAlternar={vi.fn()} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("serviço que não atende a categoria fica desabilitado, com o motivo em texto", () => {
    renderWithProviders(<ServicoOpcao servico={servico} precoCentavos={null} marcado={false} onAlternar={vi.fn()} />);

    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByText("Não atende esta categoria")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("desabilitada (enviando) não alterna", async () => {
    const onAlternar = vi.fn();
    renderWithProviders(<ServicoOpcao servico={servico} precoCentavos={3000} marcado={false} desabilitado onAlternar={onAlternar} />);

    await userEvent.click(screen.getByRole("checkbox"));
    expect(onAlternar).not.toHaveBeenCalled();
  });
});
