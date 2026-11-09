import { describe, expect, it } from "vitest";
import type { PrecoView } from "@/types/preco";
import { resumoPreco } from "./resumoPreco";

function preco(extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: 1,
    empresaConveniadaId: null,
    descricao: "Tabela",
    tipoRegra: 1,
    inicioVigencia: "2026-06-06T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 0,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 0,
    valorAdicionalDiaria: 0,
    ativo: true,
    regras: [],
    faixas: [],
    categorias: [],
    ...extra,
  };
}

describe("resumoPreco", () => {
  it("mostra o primeiro degrau (o de menor tempo) e a diária", () => {
    const resumo = resumoPreco(
      preco({
        valorDiaria: 100,
        faixas: [
          { minutosLimite: 120, valor: 25, percentualConveniada: null },
          { minutosLimite: 60, valor: 15, percentualConveniada: null },
        ],
      }),
    );
    expect(resumo).toBe("R$ 15,00 até 1 h · diária R$ 100,00");
  });

  it("omite a diária quando ela é zero", () => {
    expect(resumoPreco(preco({ faixas: [{ minutosLimite: 90, valor: 12, percentualConveniada: null }] }))).toBe("R$ 12,00 até 1 h 30 min");
  });

  it("sem degraus mostra só a diária, ou 'Sem valores' quando também não há diária", () => {
    expect(resumoPreco(preco({ valorDiaria: 80 }))).toBe("Só diária R$ 80,00");
    expect(resumoPreco(preco())).toBe("Sem valores");
  });

  it("não quebra com tipo de regra desconhecido", () => {
    expect(resumoPreco(preco({ tipoRegra: null }))).toBe("Sem valores");
  });
});
