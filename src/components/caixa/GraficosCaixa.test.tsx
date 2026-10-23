import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { Movimento } from "@/types/caixa";
import { GraficosCaixa } from "./GraficosCaixa";

let seq = 1;
function mov(extra: Partial<Movimento> = {}): Movimento {
  return {
    movimentoId: seq++,
    dataHora: "2026-10-23T09:00:00",
    tipo: "entrada",
    valor: 10,
    formaPagamento: 1,
    turnoId: 1,
    usuario: "Ana",
    motivo: null,
    ...extra,
  };
}

describe("GraficosCaixa", () => {
  const movimentos = [
    mov({ valor: 100, formaPagamento: 1, dataHora: "2026-10-23T09:10:00" }),
    mov({ valor: 200, formaPagamento: 2, dataHora: "2026-10-23T14:00:00" }),
    mov({ tipo: "saida", valor: 30, formaPagamento: 2, dataHora: "2026-10-23T14:20:00" }),
    mov({ tipo: "sangria", valor: 50, formaPagamento: 1, dataHora: "2026-10-23T15:00:00" }),
  ];

  it("mostra por forma de pagamento os valores em texto, com dinheiro primeiro", () => {
    renderWithTheme(<GraficosCaixa movimentos={movimentos} />);

    const painel = screen.getByRole("region", { name: "Por forma de pagamento" });
    const itens = within(painel).getAllByRole("listitem");
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent("Dinheiro");
    expect(itens[0]).toHaveTextContent("Entradas R$ 100,00");
    expect(itens[0]).toHaveTextContent("Saídas R$ 50,00");
    expect(itens[1]).toHaveTextContent("Pix");
    expect(itens[1]).toHaveTextContent("Entradas R$ 200,00");
    expect(itens[1]).toHaveTextContent("Saídas R$ 30,00");
  });

  it("resume o pico de entradas em texto e descreve o gráfico por hora para leitor de tela", () => {
    renderWithTheme(<GraficosCaixa movimentos={movimentos} />);

    const painel = screen.getByRole("region", { name: "Por hora" });
    expect(within(painel).getByText("Pico de entradas às 14h: R$ 200,00.")).toBeInTheDocument();
    expect(within(painel).getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining("Pico de entradas às 14h"));
  });

  it("oferece a tabela com os valores por hora, só das horas com movimento", () => {
    renderWithTheme(<GraficosCaixa movimentos={movimentos} />);

    const painel = screen.getByRole("region", { name: "Por hora" });
    const linhas = within(painel).getAllByRole("row", { hidden: true }).slice(1);
    expect(linhas.map((linha) => linha.textContent)).toEqual([
      expect.stringContaining("9h"),
      expect.stringContaining("14h"),
      expect.stringContaining("15h"),
    ]);
    expect(linhas[1]).toHaveTextContent("R$ 200,00");
    expect(linhas[1]).toHaveTextContent("R$ 30,00");
    expect(linhas[2]).toHaveTextContent("R$ 50,00");
  });

  it("a legenda explica as cores com texto", () => {
    renderWithTheme(<GraficosCaixa movimentos={movimentos} />);

    expect(screen.getAllByText("Entradas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Saídas e retiradas").length).toBeGreaterThan(0);
  });

  it("sem movimentos mostra o estado vazio nos dois painéis", () => {
    renderWithTheme(<GraficosCaixa movimentos={[]} />);

    expect(screen.getAllByText("Sem movimentos para o gráfico.")).toHaveLength(2);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("só saídas: há gráfico, mas sem pico de entradas", () => {
    renderWithTheme(<GraficosCaixa movimentos={[mov({ tipo: "saida", valor: 20 })]} />);

    expect(screen.getByText("Sem entradas no período.")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
