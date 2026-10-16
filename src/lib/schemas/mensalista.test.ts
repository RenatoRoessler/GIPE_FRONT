import { describe, expect, it } from "vitest";
import { mensalistaSchema, tipoSchema } from "./mensalista";

const mensalistaValido = {
  mensalistaTipoId: "1",
  tipoPessoa: "1",
  documento: "529.982.247-25",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "(11) 91234-5678",
  diaVencimento: "5",
  ativo: true,
};

function erroEm(result: ReturnType<typeof mensalistaSchema.safeParse>, campo: string) {
  return !result.success && result.error.issues.some((issue) => issue.path[0] === campo);
}

describe("mensalistaSchema", () => {
  it("aceita um mensalista válido", () => {
    expect(mensalistaSchema.safeParse(mensalistaValido).success).toBe(true);
  });

  it("valida o documento conforme o tipo de pessoa", () => {
    expect(erroEm(mensalistaSchema.safeParse({ ...mensalistaValido, documento: "111.111.111-11" }), "documento")).toBe(true);
    // CNPJ não vale como CPF
    expect(erroEm(mensalistaSchema.safeParse({ ...mensalistaValido, documento: "11.222.333/0001-81" }), "documento")).toBe(true);
    expect(
      mensalistaSchema.safeParse({ ...mensalistaValido, tipoPessoa: "2", documento: "12.ABC.345/01DE-35" }).success,
    ).toBe(true);
  });

  it("exige celular com DDD + 9 dígitos", () => {
    expect(erroEm(mensalistaSchema.safeParse({ ...mensalistaValido, celular: "(11) 3123-4567" }), "celular")).toBe(true);
    expect(erroEm(mensalistaSchema.safeParse({ ...mensalistaValido, celular: "11812345678" }), "celular")).toBe(true);
  });

  it.each(["0", "32", "abc", "", "5.5"])("recusa dia de vencimento %j", (dia) => {
    expect(erroEm(mensalistaSchema.safeParse({ ...mensalistaValido, diaVencimento: dia }), "diaVencimento")).toBe(true);
  });

  it.each(["1", "31"])("aceita dia de vencimento %s", (dia) => {
    expect(mensalistaSchema.safeParse({ ...mensalistaValido, diaVencimento: dia }).success).toBe(true);
  });

  it("exige tipo, nome e e-mail válidos", () => {
    expect(erroEm(mensalistaSchema.safeParse({ ...mensalistaValido, mensalistaTipoId: "" }), "mensalistaTipoId")).toBe(true);
    expect(erroEm(mensalistaSchema.safeParse({ ...mensalistaValido, nome: "  " }), "nome")).toBe(true);
    expect(erroEm(mensalistaSchema.safeParse({ ...mensalistaValido, email: "maria@" }), "email")).toBe(true);
  });
});

const tipoValido = {
  tipoMensal: "Diurno",
  categoria: "2",
  valorMensalidade: "280,00",
  horarioEntrada: "",
  horarioSaida: "",
  ativo: true,
};

describe("tipoSchema", () => {
  it("aceita um tipo válido, com e sem horário", () => {
    expect(tipoSchema.safeParse(tipoValido).success).toBe(true);
    expect(tipoSchema.safeParse({ ...tipoValido, horarioEntrada: "07:00", horarioSaida: "19:00" }).success).toBe(true);
  });

  it("aceita saída menor que a entrada", () => {
    expect(tipoSchema.safeParse({ ...tipoValido, horarioEntrada: "19:00", horarioSaida: "07:00" }).success).toBe(true);
  });

  it("exige os dois horários juntos", () => {
    const soEntrada = tipoSchema.safeParse({ ...tipoValido, horarioEntrada: "07:00" });
    const soSaida = tipoSchema.safeParse({ ...tipoValido, horarioSaida: "19:00" });
    expect(!soEntrada.success && soEntrada.error.issues[0].path[0]).toBe("horarioSaida");
    expect(!soSaida.success && soSaida.error.issues[0].path[0]).toBe("horarioEntrada");
  });

  it.each(["0", "0,00", "-5", "", "abc"])("recusa valor %j", (valor) => {
    expect(tipoSchema.safeParse({ ...tipoValido, valorMensalidade: valor }).success).toBe(false);
  });

  it("aceita a categoria 'todas' (99) e recusa categoria inválida", () => {
    expect(tipoSchema.safeParse({ ...tipoValido, categoria: "99" }).success).toBe(true);
    expect(tipoSchema.safeParse({ ...tipoValido, categoria: "" }).success).toBe(false);
    expect(tipoSchema.safeParse({ ...tipoValido, categoria: "7" }).success).toBe(false);
  });

  it("limita o nome a 100 caracteres", () => {
    expect(tipoSchema.safeParse({ ...tipoValido, tipoMensal: "a".repeat(101) }).success).toBe(false);
    expect(tipoSchema.safeParse({ ...tipoValido, tipoMensal: "" }).success).toBe(false);
  });
});
