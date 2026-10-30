import { describe, expect, it } from "vitest";
import { AGRUPAMENTO_FLUXO, TIPO_LANCAMENTO } from "@/types/financeiro";
import { financeiroUrl, fluxoParaQuery, lancamentosParaQuery, lerFluxo, lerLancamentos, parseAba } from "./url";

const HOJE = new Date(2026, 9, 30);
const leitor = (consulta: string) => new URLSearchParams(consulta);

describe("parseAba", () => {
  it("reconhece as três abas e cai no fluxo com valor desconhecido", () => {
    expect(parseAba("lancamentos")).toBe("lancamentos");
    expect(parseAba("categorias")).toBe("categorias");
    expect(parseAba("fluxo")).toBe("fluxo");
    expect(parseAba(null)).toBe("fluxo");
    expect(parseAba("outra")).toBe("fluxo");
  });
});

describe("lerFluxo", () => {
  it("sem parâmetros, abre no mês corrente inteiro, por dia", () => {
    expect(lerFluxo(leitor(""), HOJE)).toEqual({ de: "2026-10-01", ate: "2026-10-31", ver: AGRUPAMENTO_FLUXO.Dia });
  });

  it("lê período e agrupamento mensal", () => {
    expect(lerFluxo(leitor("de=2026-01-01&ate=2026-12-31&ver=mes"), HOJE)).toEqual({ de: "2026-01-01", ate: "2026-12-31", ver: AGRUPAMENTO_FLUXO.Mes });
  });

  it("com só uma data, ou datas malformadas, volta ao mês corrente", () => {
    expect(lerFluxo(leitor("de=2026-01-01"), HOJE).de).toBe("2026-10-01");
    expect(lerFluxo(leitor("de=01/10/2026&ate=2026-10-31"), HOJE).de).toBe("2026-10-01");
  });

  it("agrupamento inválido vira dia", () => {
    expect(lerFluxo(leitor("ver=ano"), HOJE).ver).toBe(AGRUPAMENTO_FLUXO.Dia);
  });
});

describe("fluxoParaQuery", () => {
  it("o padrão não vai para o endereço", () => {
    expect(fluxoParaQuery({ de: "2026-10-01", ate: "2026-10-31", ver: AGRUPAMENTO_FLUXO.Dia }, HOJE)).toEqual({});
  });

  it("período diferente e agrupamento mensal vão", () => {
    expect(fluxoParaQuery({ de: "2026-09-01", ate: "2026-09-30", ver: AGRUPAMENTO_FLUXO.Mes }, HOJE)).toEqual({ de: "2026-09-01", ate: "2026-09-30", ver: "mes" });
  });
});

describe("lerLancamentos", () => {
  it("sem parâmetros: sem filtros, sem cancelados, página 1", () => {
    expect(lerLancamentos(leitor(""))).toEqual({ incluirCancelados: false, pagina: 1 });
  });

  it("lê todos os filtros, com o período em lde e late", () => {
    expect(lerLancamentos(leitor("lde=2026-10-01&late=2026-10-31&tipo=saida&categoria=7&cancelados=1&pagina=3"))).toEqual({
      de: "2026-10-01",
      ate: "2026-10-31",
      tipo: TIPO_LANCAMENTO.Saida,
      financeiroCategoriaId: 7,
      incluirCancelados: true,
      pagina: 3,
    });
  });

  it("não confunde o período dos lançamentos com o do fluxo", () => {
    expect(lerLancamentos(leitor("de=2026-10-01&ate=2026-10-31"))).toEqual({ incluirCancelados: false, pagina: 1 });
  });

  it("valores inválidos são ignorados", () => {
    expect(lerLancamentos(leitor("lde=ontem&tipo=x&categoria=abc&pagina=0&cancelados=sim"))).toEqual({ incluirCancelados: false, pagina: 1 });
    expect(lerLancamentos(leitor("categoria=-3&pagina=1.5"))).toEqual({ incluirCancelados: false, pagina: 1 });
  });
});

describe("lancamentosParaQuery", () => {
  it("devolve só o que foi preenchido e omite a página 1", () => {
    expect(lancamentosParaQuery({ incluirCancelados: false, pagina: 1 })).toEqual({});
    expect(lancamentosParaQuery({ de: "2026-10-01", tipo: TIPO_LANCAMENTO.Entrada, financeiroCategoriaId: 2, incluirCancelados: true, pagina: 2 })).toEqual({
      lde: "2026-10-01",
      tipo: "entrada",
      categoria: "2",
      cancelados: "1",
      pagina: "2",
    });
  });

  it("ida e volta mantém os filtros", () => {
    const filtros = { de: "2026-10-01", ate: "2026-10-31", tipo: TIPO_LANCAMENTO.Saida, financeiroCategoriaId: 9, incluirCancelados: true, pagina: 4 };
    expect(lerLancamentos(new URLSearchParams(lancamentosParaQuery(filtros)))).toEqual(filtros);
  });
});

describe("financeiroUrl", () => {
  it("o fluxo, por ser o padrão, fica sem aba", () => {
    expect(financeiroUrl("fluxo")).toBe("/financeiro");
    expect(financeiroUrl("fluxo", { ver: "mes" })).toBe("/financeiro?ver=mes");
  });

  it("as outras abas levam aba e parâmetros", () => {
    expect(financeiroUrl("categorias")).toBe("/financeiro?aba=categorias");
    expect(financeiroUrl("lancamentos", { lde: "2026-10-01", categoria: "7" })).toBe("/financeiro?aba=lancamentos&lde=2026-10-01&categoria=7");
  });
});
