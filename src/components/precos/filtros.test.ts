import { describe, expect, it } from "vitest";
import type { PrecoView } from "@/types/preco";
import { contarPrecos, filtrarPrecos, normalizarTexto, parseFiltroSituacao } from "./filtros";

const AGORA = new Date(2026, 9, 17, 12, 0, 0);

function preco(descricao: string, extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: 1,
    empresaConveniadaId: null,
    descricao,
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

const VIGENTE = preco("Tarifa padrão rotativo");
const AGENDADA = preco("Black Friday", { inicioVigencia: "2026-11-27T00:00:00", fimVigencia: "2026-11-30T00:00:00" });
const ENCERRADA = preco("Tarifa verão 2025", { inicioVigencia: "2025-12-01T00:00:00", fimVigencia: "2026-06-05T00:00:00" });
const INATIVA = preco("Promoção noturna", { ativo: false });
const TODAS = [VIGENTE, AGENDADA, ENCERRADA, INATIVA];

describe("normalizarTexto", () => {
  it("ignora caixa, acento e espaços nas pontas", () => {
    expect(normalizarTexto("  PROMOÇÃO Noturna ")).toBe("promocao noturna");
    expect(normalizarTexto("Convênio")).toBe("convenio");
  });
});

describe("parseFiltroSituacao", () => {
  it.each(["todas", "vigente", "agendada", "encerrada", "inativa"])("aceita %s", (valor) => {
    expect(parseFiltroSituacao(valor)).toBe(valor);
  });

  it.each([null, undefined, "", "qualquer", "VIGENTE"])("cai em todas para %j", (valor) => {
    expect(parseFiltroSituacao(valor)).toBe("todas");
  });
});

describe("filtrarPrecos", () => {
  it("sem busca nem situação devolve tudo, na mesma ordem", () => {
    expect(filtrarPrecos(TODAS, { q: "", situacao: "todas" }, AGORA)).toEqual(TODAS);
  });

  it("busca por parte da descrição sem diferenciar caixa nem acento", () => {
    expect(filtrarPrecos(TODAS, { q: "promocao", situacao: "todas" }, AGORA)).toEqual([INATIVA]);
    expect(filtrarPrecos(TODAS, { q: "TARIFA", situacao: "todas" }, AGORA)).toEqual([VIGENTE, ENCERRADA]);
  });

  it("busca só com espaços equivale a sem busca", () => {
    expect(filtrarPrecos(TODAS, { q: "   ", situacao: "todas" }, AGORA)).toEqual(TODAS);
  });

  it("busca sem resultado devolve lista vazia", () => {
    expect(filtrarPrecos(TODAS, { q: "zzz", situacao: "todas" }, AGORA)).toEqual([]);
  });

  it.each([
    ["vigente", [VIGENTE]],
    ["agendada", [AGENDADA]],
    ["encerrada", [ENCERRADA]],
    ["inativa", [INATIVA]],
  ] as const)("filtra a situação %s", (situacao, esperado) => {
    expect(filtrarPrecos(TODAS, { q: "", situacao }, AGORA)).toEqual(esperado);
  });

  it("combina busca e situação", () => {
    expect(filtrarPrecos(TODAS, { q: "tarifa", situacao: "encerrada" }, AGORA)).toEqual([ENCERRADA]);
    expect(filtrarPrecos(TODAS, { q: "black", situacao: "vigente" }, AGORA)).toEqual([]);
  });

  it("usa o instante informado para decidir a situação", () => {
    const depois = new Date(2026, 10, 28, 12, 0, 0);
    expect(filtrarPrecos(TODAS, { q: "black", situacao: "vigente" }, depois)).toEqual([AGENDADA]);
  });
});

describe("contarPrecos", () => {
  it("conta tabelas quando não há filtro de situação", () => {
    expect(contarPrecos(7, "todas")).toBe("7 tabelas");
    expect(contarPrecos(1, "todas")).toBe("1 tabela");
    expect(contarPrecos(0, "todas")).toBe("0 tabelas");
  });

  it.each([
    [3, "vigente", "3 vigentes"],
    [1, "vigente", "1 vigente"],
    [2, "agendada", "2 agendadas"],
    [1, "encerrada", "1 encerrada"],
    [4, "inativa", "4 inativas"],
  ] as const)("com %i em %s diz %s", (total, situacao, texto) => {
    expect(contarPrecos(total, situacao)).toBe(texto);
  });
});
