import { describe, expect, it } from "vitest";
import type { Movimento } from "@/types/caixa";
import { somarMovimentos } from "./movimentos";

const mov = (extra: Partial<Movimento>): Movimento => ({
  movimentoId: 1,
  dataHora: "2026-10-12T09:00:00",
  tipo: "entrada",
  valor: 0,
  formaPagamento: 1,
  turnoId: 1,
  usuario: "Ana",
  motivo: null,
  ...extra,
});

describe("somarMovimentos", () => {
  it("separa entradas e trata saída e sangria como saídas", () => {
    expect(
      somarMovimentos([mov({ valor: 100 }), mov({ tipo: "saida", valor: 30 }), mov({ tipo: "sangria", valor: 50 })]),
    ).toEqual({ entradas: 100, saidas: 80 });
  });

  it("ignora valor que não é número e arredonda os centavos", () => {
    expect(somarMovimentos([mov({ valor: 0.1 }), mov({ valor: 0.2 }), mov({ tipo: "saida", valor: Number.NaN })])).toEqual({
      entradas: 0.3,
      saidas: 0,
    });
  });

  it("lista vazia soma zero", () => {
    expect(somarMovimentos([])).toEqual({ entradas: 0, saidas: 0 });
  });
});
