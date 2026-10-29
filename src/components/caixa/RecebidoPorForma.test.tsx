import type { UseQueryResult } from "@tanstack/react-query";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithTheme } from "@/test/render";
import type { Caixa, Movimento } from "@/types/caixa";
import { RecebidoPorForma } from "./RecebidoPorForma";

const caixa: Caixa = { caixaId: 1, dataHoraAbertura: "2026-10-29T07:00:00", valorFundoCaixa: 100, valorTotalEntrada: 100, valorTotalSaida: 0 };

let seq = 1;
function entrada(formaPagamento: number, valor: number): Movimento {
  return { movimentoId: seq++, dataHora: "2026-10-29T09:00:00", tipo: "entrada", valor, formaPagamento, turnoId: 1, usuario: "Ana", motivo: null };
}

function consulta(extra: Record<string, unknown>) {
  return { data: undefined, isError: false, error: null, refetch: vi.fn(), ...extra } as unknown as UseQueryResult<Movimento[]>;
}

describe("RecebidoPorForma", () => {
  it("lista as quatro formas com valor e tickets, mesmo as zeradas, e o total recebido", () => {
    renderWithTheme(<RecebidoPorForma caixa={caixa} movimentos={consulta({ data: [entrada(1, 60), entrada(1, 15), entrada(4, 25)] })} />);

    const cartao = screen.getByRole("region", { name: "Por forma de pagamento" });
    expect(cartao).toHaveTextContent("R$ 100,00");
    const linhas = within(cartao).getAllByRole("listitem");
    expect(linhas.map((linha) => linha.textContent)).toEqual([
      "Dinheiro2 ticketsR$ 75,00",
      "Pix0 ticketsR$ 0,00",
      "Cartão de débito0 ticketsR$ 0,00",
      "Cartão de crédito1 ticketR$ 25,00",
    ]);
  });

  it("sem movimentos mostra tudo zerado, sem NaN", () => {
    renderWithTheme(<RecebidoPorForma caixa={caixa} movimentos={consulta({ data: [] })} />);

    expect(screen.getByRole("region", { name: "Por forma de pagamento" })).not.toHaveTextContent("NaN");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("enquanto carrega mostra o estado de espera", () => {
    renderWithTheme(<RecebidoPorForma caixa={caixa} movimentos={consulta({})} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("erro mostra a mensagem no cartão e permite nova tentativa", async () => {
    const refetch = vi.fn();
    renderWithTheme(<RecebidoPorForma caixa={caixa} movimentos={consulta({ isError: true, error: new ApiError("server"), refetch })} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
