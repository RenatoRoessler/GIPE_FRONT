import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { STATUS_SERVICO, type ItemFila } from "@/types/servico";
import { ResumoDaFila } from "./ResumoDaFila";

const AGORA = new Date("2026-11-14T15:00:00Z").getTime();
const atras = (minutos: number) => new Date(AGORA - minutos * 60_000).toISOString();

const item = (id: number, status: ItemFila["status"], extra: Partial<ItemFila> = {}): ItemFila => ({
  patioServicoId: id,
  idPatio: 100 + id,
  nomeServico: "Lavagem",
  status,
  placa: "ABC1D23",
  modelo: null,
  cor: null,
  categoria: null,
  prisma: null,
  entradaEm: null,
  ...extra,
});

describe("ResumoDaFila", () => {
  it("conta os serviços de cada status, em texto", () => {
    renderWithProviders(
      <ResumoDaFila
        agora={AGORA}
        itens={[item(1, STATUS_SERVICO.Aguardando), item(2, STATUS_SERVICO.Aguardando), item(3, STATUS_SERVICO.EmExecucao), item(4, STATUS_SERVICO.Pronto), item(5, STATUS_SERVICO.Pronto)]}
      />,
    );

    const resumo = screen.getByRole("list", { name: "Resumo da fila" });
    expect(within(resumo).getByText("2 na fila")).toBeInTheDocument();
    expect(within(resumo).getByText("1 em andamento")).toBeInTheDocument();
    expect(within(resumo).getByText("2 prontos")).toBeInTheDocument();
  });

  it("um pronto fica no singular", () => {
    renderWithProviders(<ResumoDaFila agora={AGORA} itens={[item(1, STATUS_SERVICO.Pronto)]} />);

    expect(screen.getByText("1 pronto")).toBeInTheDocument();
    expect(screen.getByText("0 na fila")).toBeInTheDocument();
  });

  it("fila vazia mostra zeros e nenhum atraso", () => {
    renderWithProviders(<ResumoDaFila agora={AGORA} itens={[]} />);

    expect(screen.getByText("0 em andamento")).toBeInTheDocument();
    expect(screen.queryByText(/passou da previsão/)).not.toBeInTheDocument();
  });

  it("mostra quantos passaram da previsão só quando há", () => {
    const itens = [
      item(1, STATUS_SERVICO.EmExecucao, { iniciadoEm: atras(90), duracaoMinutos: 60 }),
      item(2, STATUS_SERVICO.EmExecucao, { iniciadoEm: atras(100), duracaoMinutos: 60 }),
      item(3, STATUS_SERVICO.EmExecucao, { iniciadoEm: atras(10), duracaoMinutos: 60 }),
    ];
    renderWithProviders(<ResumoDaFila agora={AGORA} itens={itens} />);

    expect(screen.getByText("2 passou da previsão")).toBeInTheDocument();
    expect(screen.getByText("3 em andamento")).toBeInTheDocument();
  });

  it("sem os tempos do back, nunca fala em atraso", () => {
    renderWithProviders(<ResumoDaFila agora={AGORA} itens={[item(1, STATUS_SERVICO.EmExecucao)]} />);

    expect(screen.queryByText(/passou da previsão/)).not.toBeInTheDocument();
  });
});
