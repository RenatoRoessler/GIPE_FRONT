import { describe, expect, it } from "vitest";
import { SITUACAO_FATURA } from "@/types/fatura";
import { faturaUrl, filtrosUrl, parseFiltros } from "./url";

const ler = (consulta: string) => parseFiltros(new URLSearchParams(consulta));

describe("parseFiltros", () => {
  it("sem parâmetros: sem filtro e página 1", () => {
    expect(ler("")).toEqual({ empresaConveniadaId: null, situacao: null, pagina: 1 });
  });

  it("lê conveniada, situação e página", () => {
    expect(ler("conveniada=53&situacao=aberta&pagina=2")).toEqual({ empresaConveniadaId: 53, situacao: SITUACAO_FATURA.Aberta, pagina: 2 });
    expect(ler("situacao=paga").situacao).toBe(SITUACAO_FATURA.Paga);
    expect(ler("situacao=cancelada").situacao).toBe(SITUACAO_FATURA.Cancelada);
  });

  it("valores inválidos viram o padrão", () => {
    expect(ler("conveniada=abc&situacao=outra&pagina=0")).toEqual({ empresaConveniadaId: null, situacao: null, pagina: 1 });
    expect(ler("conveniada=-3&pagina=1.5&situacao=toString")).toEqual({ empresaConveniadaId: null, situacao: null, pagina: 1 });
  });
});

describe("filtrosUrl", () => {
  it("o padrão não vai para a URL", () => {
    expect(filtrosUrl({ empresaConveniadaId: null, situacao: null, pagina: 1 })).toBe("/faturas");
  });

  it("só leva o que foge do padrão", () => {
    expect(filtrosUrl({ empresaConveniadaId: 53, situacao: null, pagina: 1 })).toBe("/faturas?conveniada=53");
    expect(filtrosUrl({ empresaConveniadaId: null, situacao: SITUACAO_FATURA.Paga, pagina: 3 })).toBe("/faturas?situacao=paga&pagina=3");
  });

  it("ida e volta", () => {
    const filtros = { empresaConveniadaId: 53, situacao: SITUACAO_FATURA.Cancelada, pagina: 4 };
    const consulta = filtrosUrl(filtros).split("?")[1];

    expect(ler(consulta)).toEqual(filtros);
  });
});

describe("faturaUrl", () => {
  it("leva ao detalhe, com a marca de emissão quando a fatura acabou de ser emitida", () => {
    expect(faturaUrl(12)).toBe("/faturas/12");
    expect(faturaUrl(12, true)).toBe("/faturas/12?emitida=1");
  });
});
