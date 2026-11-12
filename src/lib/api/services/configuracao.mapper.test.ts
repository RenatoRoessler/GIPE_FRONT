import { describe, expect, it } from "vitest";
import { fromConfiguracaoResponse, toConfiguracaoPayload } from "./configuracao.mapper";

describe("fromConfiguracaoResponse", () => {
  it("lê os campos, as opções da empresa e a última alteração", () => {
    expect(
      fromConfiguracaoResponse({
        modelo: true,
        cor: false,
        prisma: true,
        servicos: true,
        entradaDiretoCamera: false,
        usuarioIdAlteracao: 48,
        dataAlteracao: "2026-11-08T16:36:03.122308",
      }),
    ).toEqual({
      modelo: true,
      cor: false,
      prisma: true,
      servicos: true,
      entradaDiretoCamera: false,
      alteradoPorId: 48,
      alteradoEm: "2026-11-08T16:36:03.122308",
    });
  });

  it("empresa nunca alterada: sem autor nem data", () => {
    const configuracao = fromConfiguracaoResponse({ modelo: true, cor: true, prisma: false, usuarioIdAlteracao: null, dataAlteracao: null });
    expect(configuracao).toMatchObject({ alteradoPorId: null, alteradoEm: null });
  });

  it("campo ausente cai no padrão da empresa", () => {
    expect(fromConfiguracaoResponse({})).toEqual({
      modelo: true,
      cor: true,
      prisma: false,
      servicos: false,
      entradaDiretoCamera: true,
      alteradoPorId: null,
      alteradoEm: null,
    });
    expect(fromConfiguracaoResponse(null)).toMatchObject({ modelo: true, cor: true, prisma: false });
  });

  it("data inválida vira null e leva o autor junto", () => {
    expect(fromConfiguracaoResponse({ usuarioIdAlteracao: 3, dataAlteracao: "ontem" })).toMatchObject({ alteradoPorId: null, alteradoEm: null });
  });

  it("valor que não é booleano usa o padrão", () => {
    expect(fromConfiguracaoResponse({ modelo: "sim" as unknown as boolean })).toMatchObject({ modelo: true });
  });
});

describe("toConfiguracaoPayload", () => {
  it("envia os cinco campos, sem a auditoria", () => {
    const valores = { modelo: true, cor: false, prisma: true, servicos: true, entradaDiretoCamera: false, alteradoPorId: 1 } as never;
    expect(toConfiguracaoPayload(valores)).toEqual({ modelo: true, cor: false, prisma: true, servicos: true, entradaDiretoCamera: false });
  });
});
