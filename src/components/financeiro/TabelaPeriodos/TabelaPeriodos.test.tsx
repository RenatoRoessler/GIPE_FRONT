import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { AGRUPAMENTO_FLUXO, type FluxoPeriodo } from "@/types/financeiro";
import { TabelaPeriodos } from "./TabelaPeriodos";

function periodo(data: string, entradas = 0, saidas = 0, saldoAcumulado = 0): FluxoPeriodo {
  return { data, entradas, saidas, saldo: entradas - saidas, saldoAcumulado };
}

const dias = [periodo("2026-10-20", 35, 0, 35), periodo("2026-10-21", 0, 0, 35), periodo("2026-10-22", 0, 100, -65)];

describe("TabelaPeriodos", () => {
  it("lista todos os dias, inclusive os sem movimento, com a data completa", () => {
    renderWithTheme(<TabelaPeriodos periodos={dias} agrupamento={AGRUPAMENTO_FLUXO.Dia} />);

    const linhas = screen.getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(3);
    expect(within(linhas[0]).getByText("20/10/2026")).toBeInTheDocument();
    expect(within(linhas[1]).getByText("21/10/2026")).toBeInTheDocument();
    expect(within(linhas[1]).getAllByText(/R\$\s*0,00/)).toHaveLength(3);
  });

  it("chama o resumo de acordo com o agrupamento", () => {
    const { unmount } = renderWithTheme(<TabelaPeriodos periodos={dias} agrupamento={AGRUPAMENTO_FLUXO.Dia} />);
    expect(screen.getByText("Ver valores por dia")).toBeInTheDocument();
    unmount();

    renderWithTheme(<TabelaPeriodos periodos={[periodo("2026-10-01", 10, 0, 10)]} agrupamento={AGRUPAMENTO_FLUXO.Mes} />);
    expect(screen.getByText("Ver valores por mês")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Mês" })).toBeInTheDocument();
    expect(screen.getByText("Outubro de 2026")).toBeInTheDocument();
  });

  it("valores negativos levam o sinal − escrito", () => {
    renderWithTheme(<TabelaPeriodos periodos={dias} agrupamento={AGRUPAMENTO_FLUXO.Dia} />);

    const ultima = screen.getAllByRole("row")[3];
    // O saldo do dia (−100) e o acumulado (−65).
    expect(within(ultima).getByText(/^−\s*R\$\s*100,00$/)).toBeInTheDocument();
    expect(within(ultima).getByText(/^−\s*R\$\s*65,00$/)).toBeInTheDocument();
  });

  it("mostra as cinco colunas", () => {
    renderWithTheme(<TabelaPeriodos periodos={dias} agrupamento={AGRUPAMENTO_FLUXO.Dia} />);

    expect(screen.getAllByRole("columnheader").map((cabecalho) => cabecalho.textContent)).toEqual(["Data", "Entradas", "Saídas", "Saldo", "Acumulado"]);
  });
});
