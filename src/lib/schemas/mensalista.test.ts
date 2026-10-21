import { describe, expect, it } from "vitest";
import { zodFieldErrors } from "@/components/form/zodFieldErrors";
import { createMensalistaSchema, mensalistaSchema, tipoSchema } from "./mensalista";

const mensalistaValido = {
  mensalistaTipoId: "1",
  tipoPessoa: "1",
  documento: "529.982.247-25",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "(11) 91234-5678",
  diaVencimento: "5",
  ativo: true,
  veiculos: [],
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

describe("mensalistaSchema: veículos e condutores", () => {
  const condutor = (cpf: string, nome = "Ana Lima") => ({ uid: cpf, nome, cpf });
  const veiculo = (placa: string, extra: Record<string, unknown> = {}) => ({
    uid: placa,
    placa,
    modelo: "Gol",
    cor: "PRATA",
    categoria: "2",
    condutores: [],
    ...extra,
  });
  const juridica = { ...mensalistaValido, tipoPessoa: "2", documento: "11.222.333/0001-81" };

  function caminhos(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
    return result.success ? [] : result.error!.issues.map((issue) => issue.path.map(String).join("."));
  }

  it("aceita zero veículos", () => {
    expect(mensalistaSchema.safeParse(mensalistaValido).success).toBe(true);
  });

  it("pessoa física: aceita veículo sem condutores", () => {
    expect(mensalistaSchema.safeParse({ ...mensalistaValido, veiculos: [veiculo("ABC1D23")] }).success).toBe(true);
  });

  it("marca todas as ocorrências de placa repetida, mesmo com hífen e minúsculas", () => {
    const result = mensalistaSchema.safeParse({
      ...mensalistaValido,
      veiculos: [veiculo("ABC1D23"), veiculo("BRA2E19"), veiculo("abc-1d23")],
    });
    expect(caminhos(result)).toEqual(["veiculos.0.placa", "veiculos.2.placa"]);
  });

  it("valida placa, modelo e cor", () => {
    const result = mensalistaSchema.safeParse({
      ...mensalistaValido,
      veiculos: [veiculo("", { modelo: "x".repeat(81), cor: "y".repeat(51) }), veiculo("AB12")],
    });
    expect(caminhos(result)).toEqual(
      expect.arrayContaining(["veiculos.0.placa", "veiculos.0.modelo", "veiculos.0.cor", "veiculos.1.placa"]),
    );
  });

  it("tipo de categoria específica: só a categoria do tipo", () => {
    const schema = createMensalistaSchema({ categoriaTipo: 2 });
    expect(schema.safeParse({ ...mensalistaValido, veiculos: [veiculo("ABC1D23", { categoria: "2" })] }).success).toBe(true);
    expect(caminhos(schema.safeParse({ ...mensalistaValido, veiculos: [veiculo("ABC1D23", { categoria: "3" })] }))).toEqual([
      "veiculos.0.categoria",
    ]);
  });

  it("tipo \"todas\": qualquer categoria de veículo, menos 99", () => {
    const schema = createMensalistaSchema({ categoriaTipo: 99 });
    expect(schema.safeParse({ ...mensalistaValido, veiculos: [veiculo("ABC1D23", { categoria: "5" })] }).success).toBe(true);
    expect(caminhos(schema.safeParse({ ...mensalistaValido, veiculos: [veiculo("ABC1D23", { categoria: "99" })] }))).toEqual([
      "veiculos.0.categoria",
    ]);
    expect(caminhos(schema.safeParse({ ...mensalistaValido, veiculos: [veiculo("ABC1D23", { categoria: "" })] }))).toEqual([
      "veiculos.0.categoria",
    ]);
  });

  it("pessoa jurídica: exige ao menos um condutor por veículo", () => {
    const result = mensalistaSchema.safeParse({ ...juridica, veiculos: [veiculo("ABC1D23")] });
    expect(caminhos(result)).toEqual(["veiculos.0.condutores"]);
  });

  it("pessoa jurídica: valida nome e CPF do condutor", () => {
    const result = mensalistaSchema.safeParse({
      ...juridica,
      veiculos: [veiculo("ABC1D23", { condutores: [condutor("111.111.111-11", ""), condutor("")] })],
    });
    expect(caminhos(result)).toEqual(
      expect.arrayContaining(["veiculos.0.condutores.0.cpf", "veiculos.0.condutores.0.nome", "veiculos.0.condutores.1.cpf"]),
    );
  });

  it("pessoa jurídica: CPF repetido no mesmo veículo é recusado, em veículos diferentes é aceito", () => {
    const mesmo = mensalistaSchema.safeParse({
      ...juridica,
      veiculos: [veiculo("ABC1D23", { condutores: [condutor("529.982.247-25"), condutor("52998224725", "Outro")] })],
    });
    expect(caminhos(mesmo)).toEqual(["veiculos.0.condutores.0.cpf", "veiculos.0.condutores.1.cpf"]);

    const diferentes = mensalistaSchema.safeParse({
      ...juridica,
      veiculos: [
        veiculo("ABC1D23", { condutores: [condutor("529.982.247-25")] }),
        veiculo("BRA2E19", { condutores: [condutor("529.982.247-25")] }),
      ],
    });
    expect(diferentes.success).toBe(true);
  });

  it("pessoa física ignora condutores", () => {
    const result = mensalistaSchema.safeParse({
      ...mensalistaValido,
      veiculos: [veiculo("ABC1D23", { condutores: [condutor("111.111.111-11")] })],
    });
    // O CPF inválido do condutor ainda passa pelo schema de item, mas a regra de PJ não se aplica.
    expect(caminhos(result)).not.toContain("veiculos.0.condutores");
  });

  it("zodFieldErrors gera nomes aninhados no formato do TanStack Form", () => {
    const result = mensalistaSchema.safeParse({
      ...juridica,
      veiculos: [veiculo("ABC1D23", { condutores: [condutor("529.982.247-25"), condutor("111.111.111-11")] })],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = zodFieldErrors(result)?.fields ?? {};
      expect(Object.keys(errors)).toContain("veiculos[0].condutores[1].cpf");
    }
  });
});
