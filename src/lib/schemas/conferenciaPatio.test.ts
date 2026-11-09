import { describe, expect, it } from "vitest";
import { MOTIVO_SAIDA } from "@/types/conferenciaPatio";
import {
  DESCRICAO_SAIDA_MAX,
  criarEntradaConferenciaSchema,
  entradaConferenciaSchema,
  type EntradaConferenciaValues,
  MODELO_MAX,
  observacaoSchema,
  placaDigitadaSchema,
  saidaConferenciaSchema,
  toEntradaConferenciaPayload,
  toMotivoSaida,
} from "./conferenciaPatio";

describe("placaDigitadaSchema", () => {
  it.each(["ABC1D23", "abc-1234", " BRA2E19 "])("aceita %s", (placa) => {
    expect(placaDigitadaSchema.safeParse({ placa }).success).toBe(true);
  });

  it.each(["", "ABC", "1234567", "AB1C234"])("recusa %j", (placa) => {
    expect(placaDigitadaSchema.safeParse({ placa }).success).toBe(false);
  });
});

describe("saidaConferenciaSchema", () => {
  const motivo = (valor: number, descricao = "") => ({ motivo: String(valor), descricao });

  it("exige o motivo", () => {
    expect(saidaConferenciaSchema.safeParse({ motivo: "", descricao: "" }).success).toBe(false);
  });

  it.each([MOTIVO_SAIDA.SaiuSemBaixa, MOTIVO_SAIDA.TicketDuplicado, MOTIVO_SAIDA.EntradaPorEngano])("motivo %s não pede descrição", (valor) => {
    expect(saidaConferenciaSchema.safeParse(motivo(valor)).success).toBe(true);
  });

  it("'Outro' exige a descrição", () => {
    const result = saidaConferenciaSchema.safeParse(motivo(MOTIVO_SAIDA.Outro, "   "));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ["descricao"], message: "Descreva o motivo" });
  });

  it("aceita a descrição até o limite e recusa acima", () => {
    expect(saidaConferenciaSchema.safeParse(motivo(MOTIVO_SAIDA.Outro, "a".repeat(DESCRICAO_SAIDA_MAX))).success).toBe(true);
    expect(saidaConferenciaSchema.safeParse(motivo(MOTIVO_SAIDA.Outro, "a".repeat(DESCRICAO_SAIDA_MAX + 1))).success).toBe(false);
  });

  it("toMotivoSaida envia a descrição só no motivo 'Outro'", () => {
    expect(toMotivoSaida({ motivo: "4", descricao: "Troca de turno" })).toEqual({ motivo: 4, descricao: "Troca de turno" });
    expect(toMotivoSaida({ motivo: "1", descricao: "ignorada" })).toEqual({ motivo: 1 });
  });
});

describe("entradaConferenciaSchema", () => {
  const valido: EntradaConferenciaValues = { categoria: "3", modelo: "Gol", cor: "PRATA", prisma: "", codigoTicket: "", mensalista: false };

  it("aceita os dados mínimos", () => {
    expect(entradaConferenciaSchema.safeParse(valido).success).toBe(true);
  });

  it("exige categoria, modelo e cor", () => {
    const result = entradaConferenciaSchema.safeParse({ ...valido, categoria: "", modelo: "  ", cor: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual(["categoria", "cor", "modelo"]);
  });

  it("recusa categoria fora da lista e cor fora da lista", () => {
    expect(entradaConferenciaSchema.safeParse({ ...valido, categoria: "99" }).success).toBe(false);
    expect(entradaConferenciaSchema.safeParse({ ...valido, cor: "ROSA" }).success).toBe(false);
  });

  it("limita o modelo", () => {
    expect(entradaConferenciaSchema.safeParse({ ...valido, modelo: "a".repeat(MODELO_MAX) }).success).toBe(true);
    expect(entradaConferenciaSchema.safeParse({ ...valido, modelo: "a".repeat(MODELO_MAX + 1) }).success).toBe(false);
  });

  it("o código do ticket é opcional e só tem dígitos", () => {
    expect(entradaConferenciaSchema.safeParse({ ...valido, codigoTicket: "24024" }).success).toBe(true);
    expect(entradaConferenciaSchema.safeParse({ ...valido, codigoTicket: "12a" }).success).toBe(false);
    expect(entradaConferenciaSchema.safeParse({ ...valido, codigoTicket: "1234567890" }).success).toBe(false);
  });

  it("monta o payload sem o ticket quando vazio", () => {
    expect(toEntradaConferenciaPayload(valido)).toEqual({ categoria: 3, modelo: "Gol", cor: "PRATA", mensalista: false });
    expect(toEntradaConferenciaPayload({ ...valido, modelo: " Gol ", codigoTicket: "24024", mensalista: true })).toEqual({
      categoria: 3,
      modelo: "Gol",
      cor: "PRATA",
      codigoTicket: 24024,
      mensalista: true,
    });
  });
});

describe("criarEntradaConferenciaSchema", () => {
  const valido: EntradaConferenciaValues = { categoria: "3", modelo: "Gol", cor: "PRATA", prisma: "", codigoTicket: "", mensalista: false };
  const regras = { modelo: true, cor: true, prisma: false, mensalista: false };
  const campos = (resultado: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
    resultado.error?.issues.map((issue) => issue.path[0]).sort();

  it("modelo e cor desligados aceitam vazio", () => {
    const schema = criarEntradaConferenciaSchema({ ...regras, modelo: false, cor: false });
    expect(schema.safeParse({ ...valido, modelo: "", cor: "" }).success).toBe(true);
  });

  it("modelo e cor ligados recusam vazio", () => {
    const resultado = criarEntradaConferenciaSchema(regras).safeParse({ ...valido, modelo: "", cor: "" });
    expect(campos(resultado)).toEqual(["cor", "modelo"]);
  });

  it("com o prisma ligado, exige o prisma", () => {
    const resultado = criarEntradaConferenciaSchema({ ...regras, prisma: true }).safeParse(valido);
    expect(campos(resultado)).toEqual(["prisma"]);
    expect(resultado.error?.issues[0].message).toBe("Informe o prisma (de 1 a 999)");
    expect(criarEntradaConferenciaSchema({ ...regras, prisma: true }).safeParse({ ...valido, prisma: "123" }).success).toBe(true);
  });

  it("o prisma ligado não vale para mensalista", () => {
    const schema = criarEntradaConferenciaSchema({ ...regras, prisma: true, mensalista: true });
    expect(schema.safeParse({ ...valido, mensalista: true }).success).toBe(true);
  });

  it("com o prisma desligado, aceita vazio", () => {
    expect(criarEntradaConferenciaSchema(regras).safeParse(valido).success).toBe(true);
  });

  it("o payload leva o prisma só quando preenchido e fora de mensalista, e omite modelo e cor vazios", () => {
    expect(toEntradaConferenciaPayload({ ...valido, modelo: "", cor: "", prisma: " 12 " })).toEqual({ categoria: 3, prisma: 12, mensalista: false });
    expect(toEntradaConferenciaPayload({ ...valido, prisma: "12", mensalista: true })).toEqual({ categoria: 3, modelo: "Gol", cor: "PRATA", mensalista: true });
  });
});

describe("observacaoSchema", () => {
  it("aceita até 500 caracteres", () => {
    expect(observacaoSchema.safeParse("a".repeat(500)).success).toBe(true);
    expect(observacaoSchema.safeParse("a".repeat(501)).success).toBe(false);
    expect(observacaoSchema.safeParse("").success).toBe(true);
  });
});
