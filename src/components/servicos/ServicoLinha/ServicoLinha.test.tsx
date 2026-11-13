import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { STATUS_SERVICO, type ServicoDoVeiculo } from "@/types/servico";
import { ServicoLinha } from "./ServicoLinha";

const servico = (status: ServicoDoVeiculo["status"]): ServicoDoVeiculo => ({
  id: 1,
  servicoId: 7,
  nome: "Lavagem simples",
  valorCentavos: 3000,
  tempoPermitidoMinutos: null,
  status,
  motivoCancelamento: null,
  adicionadoEm: null,
  adicionadoPor: null,
  previsaoEm: null,
  prontoEm: null,
});

function renderizar(linha: ServicoDoVeiculo, onAcoes?: (servico: ServicoDoVeiculo) => void) {
  renderWithProviders(
    <ul>
      <ServicoLinha servico={linha} onAcoes={onAcoes} />
    </ul>,
  );
}

describe("ServicoLinha", () => {
  it.each([
    [STATUS_SERVICO.Aguardando, "Na fila"],
    [STATUS_SERVICO.EmExecucao, "Em andamento"],
    [STATUS_SERVICO.Pronto, "Pronto"],
  ] as const)("mostra o nome, o valor e o status %s em texto", (status, rotulo) => {
    renderizar(servico(status), vi.fn());

    expect(screen.getByText("Lavagem simples")).toBeInTheDocument();
    expect(screen.getByText("R$ 30,00")).toBeInTheDocument();
    expect(screen.getByText(rotulo)).toBeInTheDocument();
  });

  it("o menu tem nome acessível com o serviço e abre o detalhe", async () => {
    const onAcoes = vi.fn();
    const linha = servico(STATUS_SERVICO.Aguardando);
    renderizar(linha, onAcoes);

    await userEvent.click(screen.getByRole("button", { name: "Ações de Lavagem simples" }));

    expect(onAcoes).toHaveBeenCalledWith(linha);
  });

  it("sem quem possa agir, não mostra o menu", () => {
    renderizar(servico(STATUS_SERVICO.Pronto));

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
