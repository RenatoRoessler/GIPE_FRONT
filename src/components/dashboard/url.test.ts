import { describe, expect, it } from "vitest";
import { dashboardUrl, dataParaApi, filtrosParaQuery, lerFiltros } from "./url";

const hoje = new Date(2026, 10, 19, 15, 45);
const dia = (ano: number, mes: number, d: number) => new Date(ano, mes - 1, d);
const ler = (consulta: string) => lerFiltros(new URLSearchParams(consulta), hoje);

describe("lerFiltros", () => {
  it("sem parâmetros abre o dia de hoje", () => {
    expect(ler("")).toEqual({ tipo: "dia", data: dia(2026, 11, 19) });
  });

  it("lê o período e a data", () => {
    expect(ler("periodo=semana&data=2026-11-10")).toEqual({ tipo: "semana", data: dia(2026, 11, 10) });
    expect(ler("periodo=mes&data=2026-10-01")).toEqual({ tipo: "mes", data: dia(2026, 10, 1) });
  });

  it("período inválido volta ao dia", () => {
    expect(ler("periodo=ano").tipo).toBe("dia");
    expect(ler("periodo=").tipo).toBe("dia");
    expect(ler("periodo=2").tipo).toBe("dia");
  });

  it("data inválida volta a hoje", () => {
    expect(ler("data=ontem").data).toEqual(dia(2026, 11, 19));
    expect(ler("data=19/11/2026").data).toEqual(dia(2026, 11, 19));
    expect(ler("data=2026-02-30").data).toEqual(dia(2026, 11, 19));
    expect(ler("data=2026-13-01").data).toEqual(dia(2026, 11, 19));
  });

  it("data futura é corrigida para hoje, porque a API devolveria 400", () => {
    expect(ler("data=2026-11-20").data).toEqual(dia(2026, 11, 19));
    expect(ler("periodo=mes&data=2027-01-01").data).toEqual(dia(2026, 11, 19));
  });

  it("hoje, mesmo com hora no relógio, é aceito", () => {
    expect(ler("data=2026-11-19").data).toEqual(dia(2026, 11, 19));
  });
});

describe("filtrosParaQuery e dashboardUrl", () => {
  it("o padrão (dia de hoje) fica sem parâmetros", () => {
    expect(filtrosParaQuery({ tipo: "dia", data: dia(2026, 11, 19) }, hoje)).toEqual({});
    expect(dashboardUrl({ tipo: "dia", data: dia(2026, 11, 19) }, hoje)).toBe("/dashboard");
  });

  it("só o período aparece quando a data é do período atual", () => {
    expect(filtrosParaQuery({ tipo: "semana", data: dia(2026, 11, 16) }, hoje)).toEqual({ periodo: "semana" });
    expect(dashboardUrl({ tipo: "mes", data: dia(2026, 11, 1) }, hoje)).toBe("/dashboard?periodo=mes");
  });

  it("a data aparece quando o período não é o atual", () => {
    expect(filtrosParaQuery({ tipo: "dia", data: dia(2026, 11, 18) }, hoje)).toEqual({ data: "2026-11-18" });
    expect(dashboardUrl({ tipo: "semana", data: dia(2026, 11, 12) }, hoje)).toBe("/dashboard?periodo=semana&data=2026-11-12");
    expect(dashboardUrl({ tipo: "mes", data: dia(2026, 10, 1) }, hoje)).toBe("/dashboard?periodo=mes&data=2026-10-01");
  });

  it("o que sai da URL volta igual ao ler de novo", () => {
    const filtros = { tipo: "semana", data: dia(2026, 11, 12) } as const;
    const url = dashboardUrl(filtros, hoje);

    expect(lerFiltros(new URLSearchParams(url.split("?")[1]), hoje)).toEqual(filtros);
  });
});

describe("dataParaApi", () => {
  it("omite a data no período atual, em que o servidor assume hoje", () => {
    expect(dataParaApi({ tipo: "dia", data: dia(2026, 11, 19) }, hoje)).toBeUndefined();
    expect(dataParaApi({ tipo: "semana", data: dia(2026, 11, 17) }, hoje)).toBeUndefined();
    expect(dataParaApi({ tipo: "mes", data: dia(2026, 11, 1) }, hoje)).toBeUndefined();
  });

  it("manda AAAA-MM-DD nos períodos passados", () => {
    expect(dataParaApi({ tipo: "dia", data: dia(2026, 11, 8) }, hoje)).toBe("2026-11-08");
    expect(dataParaApi({ tipo: "mes", data: dia(2026, 10, 1) }, hoje)).toBe("2026-10-01");
  });
});
