import type { UseQueryResult } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithTheme } from "@/test/render";
import type { Caixa, Movimento } from "@/types/caixa";
import { ValorEmCaixa } from "./ValorEmCaixa";

const caixa: Caixa = { caixaId: 1, dataHoraAbertura: "2026-10-29T07:00:00", valorFundoCaixa: 100, valorTotalEntrada: 1284, valorTotalSaida: 0 };

function entrada(id: number, formaPagamento = 1): Movimento {
  return { movimentoId: id, dataHora: "2026-10-29T09:00:00", tipo: "entrada", valor: 10, formaPagamento, turnoId: 1, usuario: "Ana", motivo: null };
}

function consulta(extra: Record<string, unknown>) {
  return { data: undefined, isError: false, error: null, refetch: vi.fn(), ...extra } as unknown as UseQueryResult<Movimento[]>;
}

describe("ValorEmCaixa", () => {
  it("mostra o valor em caixa (recebido mais fundo) e a quantidade de tickets", () => {
    renderWithTheme(<ValorEmCaixa caixa={caixa} movimentos={consulta({ data: [entrada(1), entrada(2), entrada(3, 2)] })} />);

    const cartao = screen.getByRole("region", { name: "Valor em caixa" });
    expect(cartao).toHaveTextContent("1.384,00");
    expect(cartao).toHaveTextContent("Recebido R$ 1.284,00 em 3 tickets");
  });

  it("usa o singular com um ticket", () => {
    renderWithTheme(<ValorEmCaixa caixa={caixa} movimentos={consulta({ data: [entrada(1)] })} />);

    expect(screen.getByText("1 ticket")).toBeInTheDocument();
  });

  it("enquanto os movimentos carregam mostra o valor e um estado de espera", () => {
    renderWithTheme(<ValorEmCaixa caixa={caixa} movimentos={consulta({})} />);

    expect(screen.getByRole("region", { name: "Valor em caixa" })).toHaveTextContent("1.384,00");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("erro nos movimentos aparece só no cartão, com nova tentativa", async () => {
    const refetch = vi.fn();
    renderWithTheme(<ValorEmCaixa caixa={caixa} movimentos={consulta({ isError: true, error: new ApiError("server"), refetch })} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor");
    expect(screen.getByRole("region", { name: "Valor em caixa" })).toHaveTextContent("1.384,00");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
