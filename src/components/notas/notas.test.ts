import { describe, expect, it } from "vitest";
import type { NotaFiscal } from "@/types/notaFiscal";
import { ABAS, abaUrl, parseAba } from "./aba";
import { colunasVisiveis, ordenarLancadas, ordenarPendentes, resumirNotas, textoResumo } from "./notas";

function nota(extra: Partial<NotaFiscal> = {}): NotaFiscal {
  return {
    notaFiscalId: null,
    valor: null,
    dataSolicitacao: null,
    dataLancamento: null,
    documento: null,
    email: null,
    placa: null,
    ...extra,
  };
}

describe("ordenarPendentes", () => {
  it("as que esperam há mais tempo vêm primeiro; sem data vai para o fim", () => {
    const ordenadas = ordenarPendentes([
      nota({ notaFiscalId: 3, dataSolicitacao: "2026-10-22T10:00:00" }),
      nota({ notaFiscalId: 9 }),
      nota({ notaFiscalId: 1, dataSolicitacao: "2026-10-20T08:00:00" }),
    ]);
    expect(ordenadas.map((item) => item.notaFiscalId)).toEqual([1, 3, 9]);
  });

  it("não altera a lista original", () => {
    const original = [nota({ notaFiscalId: 2, dataSolicitacao: "2026-10-22" }), nota({ notaFiscalId: 1, dataSolicitacao: "2026-10-20" })];
    ordenarPendentes(original);
    expect(original.map((item) => item.notaFiscalId)).toEqual([2, 1]);
  });
});

describe("ordenarLancadas", () => {
  it("as mais recentes vêm primeiro, pelo lançamento (ou pela solicitação, quando falta)", () => {
    const ordenadas = ordenarLancadas([
      nota({ notaFiscalId: 1, dataLancamento: "2026-10-10T10:00:00" }),
      nota({ notaFiscalId: 2, dataSolicitacao: "2026-10-15T10:00:00" }),
      nota({ notaFiscalId: 3, dataLancamento: "2026-10-20T10:00:00" }),
      nota({ notaFiscalId: 4 }),
    ]);
    expect(ordenadas.map((item) => item.notaFiscalId)).toEqual([3, 2, 1, 4]);
  });
});

describe("resumirNotas", () => {
  it("conta as notas e soma os valores em reais, sem erro de ponto flutuante", () => {
    expect(resumirNotas([nota({ valor: 0.1 }), nota({ valor: 0.2 }), nota({ valor: 15100 })])).toEqual({ quantidade: 3, total: 15100.3 });
  });

  it("nota sem valor entra na contagem, não na soma", () => {
    expect(resumirNotas([nota({ valor: 10 }), nota()])).toEqual({ quantidade: 2, total: 10 });
  });

  it("lista vazia", () => {
    expect(resumirNotas([])).toEqual({ quantidade: 0, total: 0 });
  });
});

describe("colunasVisiveis", () => {
  it("só mostra a coluna que algum registro preenche", () => {
    expect(colunasVisiveis([nota({ email: "a@b.co" }), nota({ valor: 10 })], "pendentes")).toEqual({
      cliente: true,
      placa: false,
      valor: true,
      lancamento: false,
    });
  });

  it("o documento sozinho também mostra a coluna do cliente", () => {
    expect(colunasVisiveis([nota({ documento: "52998224725" })], "pendentes").cliente).toBe(true);
  });

  it("a data do lançamento só aparece nas lançadas", () => {
    const notas = [nota({ dataLancamento: "2026-10-10T10:00:00" })];
    expect(colunasVisiveis(notas, "pendentes").lancamento).toBe(false);
    expect(colunasVisiveis(notas, "lancadas").lancamento).toBe(true);
  });

  it("sem nenhum dado, nenhuma coluna opcional aparece", () => {
    expect(colunasVisiveis([nota()], "lancadas")).toEqual({ cliente: false, placa: false, valor: false, lancamento: false });
  });
});

describe("textoResumo", () => {
  it("usa singular e plural", () => {
    expect(textoResumo({ quantidade: 1 }, "pendentes")).toBe("1 nota pendente");
    expect(textoResumo({ quantidade: 3 }, "pendentes")).toBe("3 notas pendentes");
    expect(textoResumo({ quantidade: 1 }, "lancadas")).toBe("1 nota lançada no período");
    expect(textoResumo({ quantidade: 0 }, "lancadas")).toBe("0 notas lançadas no período");
  });
});

describe("abas da tela", () => {
  it("as pendentes são a aba padrão e valores desconhecidos caem nela", () => {
    expect(parseAba(null)).toBe("pendentes");
    expect(parseAba("lancadas")).toBe("lancadas");
    expect(parseAba("outra")).toBe("pendentes");
  });

  it("cada aba tem o seu endereço, e a padrão fica sem parâmetro", () => {
    expect(abaUrl("pendentes")).toBe("/notas-fiscais");
    expect(abaUrl("lancadas")).toBe("/notas-fiscais?aba=lancadas");
    expect(ABAS.map((aba) => aba.label)).toEqual(["Pendentes", "Lançadas"]);
  });
});
