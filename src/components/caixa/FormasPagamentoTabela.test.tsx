import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { Turno, TurnoFormaPagamento } from "@/types/caixa";
import { FormasPagamentoTabela, ordenarFormas } from "./FormasPagamentoTabela";
import { TurnoAtual } from "./TurnoAtual";

function forma(formaPagamento: number, entradas: number, saidas = 0, extra: Partial<TurnoFormaPagamento> = {}): TurnoFormaPagamento {
  return { formaPagamento, entradas, saidas, valorEsperado: entradas - saidas, valorInformado: null, diferenca: null, ...extra };
}

function turno(formas: TurnoFormaPagamento[]): Turno {
  return {
    turnoId: 1,
    caixaId: 1,
    usuarioId: 1,
    usuario: "Ana",
    usuarioIdFechamento: null,
    dataHoraInicio: "2026-10-23T08:00:00",
    dataHoraFim: null,
    valorFundoCaixa: 100,
    status: 1,
    saldoCaixa: 0,
    totalEntradas: null,
    totalSaidas: null,
    totalSaida: null,
    saldoCaixaInformado: null,
    totalDiferenca: null,
    observacao: null,
    disponivelSangria: null,
    formasPagamento: formas,
  };
}

describe("ordenarFormas", () => {
  it("coloca o dinheiro primeiro e o resto pelo código, sem alterar a lista original", () => {
    const original = [forma(4, 1), forma(2, 1), forma(1, 1), forma(6, 1)];
    expect(ordenarFormas(original).map((item) => item.formaPagamento)).toEqual([1, 2, 4, 6]);
    expect(original.map((item) => item.formaPagamento)).toEqual([4, 2, 1, 6]);
  });
});

describe("FormasPagamentoTabela", () => {
  it("mostra entradas, saídas e esperado em texto, com dinheiro na primeira linha", () => {
    renderWithTheme(<FormasPagamentoTabela formas={[forma(2, 150, 50), forma(1, 300, 20)]} />);

    const linhas = screen.getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(2);
    expect(within(linhas[0]).getByText("Dinheiro")).toBeInTheDocument();
    expect(linhas[0]).toHaveTextContent("R$ 300,00");
    expect(linhas[0]).toHaveTextContent("R$ 20,00");
    expect(linhas[0]).toHaveTextContent("R$ 280,00");
    expect(within(linhas[1]).getByText("Pix")).toBeInTheDocument();
    expect(linhas[1]).toHaveTextContent("R$ 100,00");
  });

  it("só mostra boleto e transferência quando a API os devolve", () => {
    renderWithTheme(<FormasPagamentoTabela formas={[forma(1, 10)]} />);
    expect(screen.queryByText("Boleto")).not.toBeInTheDocument();
    expect(screen.queryByText("Transferência bancária")).not.toBeInTheDocument();

    renderWithTheme(<FormasPagamentoTabela formas={[forma(5, 10), forma(6, 20)]} />);
    expect(screen.getByText("Boleto")).toBeInTheDocument();
    expect(screen.getByText("Transferência bancária")).toBeInTheDocument();
  });

  it("a barra de proporção é decorativa e a forma com mais entradas ocupa a largura toda", () => {
    const { container } = renderWithTheme(<FormasPagamentoTabela formas={[forma(1, 200), forma(2, 100)]} />);

    const barras = container.querySelectorAll('span[aria-hidden="true"] > span');
    expect(barras).toHaveLength(2);
    expect(barras[0]).toHaveStyle({ width: "100%" });
    expect(barras[1]).toHaveStyle({ width: "50%" });
  });

  it("sem entradas nenhuma barra cresce", () => {
    const { container } = renderWithTheme(<FormasPagamentoTabela formas={[forma(1, 0, 10)]} />);

    expect(container.querySelector('span[aria-hidden="true"] > span')).toHaveStyle({ width: "0%" });
  });

  it("usa a descrição que a API manda para formas novas", () => {
    renderWithTheme(<FormasPagamentoTabela formas={[forma(9, 5, 0, { descricao: "Vale-refeição" })]} />);

    expect(screen.getByText("Vale-refeição")).toBeInTheDocument();
  });
});

describe("TurnoAtual", () => {
  it("mostra responsável, início, fundo do turno e a tabela, sem falar em troco padrão", () => {
    renderWithTheme(<TurnoAtual turno={turno([forma(1, 300)])} />);

    expect(screen.getByText("Responsável").closest("div")).toHaveTextContent("Ana");
    expect(screen.getByText("Fundo do turno").closest("div")).toHaveTextContent("R$ 100,00");
    expect(screen.getByText("No dinheiro, o esperado não inclui o fundo de caixa.")).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toContain("troco");
  });

  it("carregando e sem turno têm estado próprio", () => {
    const { unmount } = renderWithTheme(<TurnoAtual turno={undefined} />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando turno atual");
    unmount();

    renderWithTheme(<TurnoAtual turno={null} />);
    expect(screen.getByText("Não há turno aberto.")).toBeInTheDocument();
  });
});
