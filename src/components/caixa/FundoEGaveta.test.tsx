import type { UseQueryResult } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithTheme } from "@/test/render";
import type { Caixa, Turno } from "@/types/caixa";
import { FundoEGaveta } from "./FundoEGaveta";

const caixa: Caixa = { caixaId: 1, dataHoraAbertura: "2026-10-29T07:00:00", valorFundoCaixa: 100, valorTotalEntrada: 214, valorTotalSaida: 0 };

const turno: Turno = {
  turnoId: 1,
  caixaId: 1,
  usuarioId: 1,
  usuario: "Ana",
  usuarioIdFechamento: null,
  dataHoraInicio: "2026-10-29T07:00:00",
  dataHoraFim: null,
  valorFundoCaixa: 100,
  status: 1,
  saldoCaixa: 214,
  totalEntradas: 214,
  totalSaidas: 0,
  totalSaida: null,
  saldoCaixaInformado: null,
  totalDiferenca: null,
  observacao: null,
  disponivelSangria: 214,
  formasPagamento: [{ formaPagamento: 1, entradas: 214, saidas: 0, valorEsperado: 214, valorInformado: null, diferenca: null }],
};

function consulta(extra: Record<string, unknown>) {
  return { data: undefined, isError: false, error: null, refetch: vi.fn(), ...extra } as unknown as UseQueryResult<Turno | null>;
}

describe("FundoEGaveta", () => {
  it("mostra o fundo na abertura e o dinheiro na gaveta", () => {
    renderWithTheme(<FundoEGaveta caixa={caixa} turno={consulta({ data: turno })} />);

    const fundo = screen.getByRole("region", { name: "Fundo de caixa" });
    expect(fundo).toHaveTextContent("R$ 100,00");
    expect(fundo).toHaveTextContent("Troco na abertura");
    expect(screen.getByRole("region", { name: "Dinheiro na gaveta" })).toHaveTextContent("R$ 314,00");
  });

  it("sem turno mostra traço e o aviso, mantendo o fundo", () => {
    renderWithTheme(<FundoEGaveta caixa={caixa} turno={consulta({ data: null })} />);

    const gaveta = screen.getByRole("region", { name: "Dinheiro na gaveta" });
    expect(gaveta).toHaveTextContent("—");
    expect(gaveta).toHaveTextContent("Não há turno em andamento");
    expect(screen.getByRole("region", { name: "Fundo de caixa" })).toHaveTextContent("R$ 100,00");
  });

  it("enquanto o turno carrega mostra o estado de espera só na gaveta", () => {
    renderWithTheme(<FundoEGaveta caixa={caixa} turno={consulta({})} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Fundo de caixa" })).toHaveTextContent("R$ 100,00");
  });

  it("erro no turno aparece na gaveta, com nova tentativa", async () => {
    const refetch = vi.fn();
    renderWithTheme(<FundoEGaveta caixa={caixa} turno={consulta({ isError: true, error: new ApiError("server"), refetch })} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
