import { describe, expect, it } from "vitest";
import { conveniadaSchema } from "./conveniada";

const VALIDO = {
  cnpj: "11.222.333/0001-81",
  razaoSocial: "Auto Peças Sul LTDA",
  nomeFantasia: "",
  telefone: "(11) 3456-7890",
  cep: "01310-100",
  logradouro: "Rua X",
  numero: "10",
  bairro: "Centro",
  cidade: "São Paulo",
  estado: "SP",
  usuarioNome: "Maria",
  usuarioCpf: "529.982.247-25",
  usuarioEmail: "maria@exemplo.com",
  usuarioCelular: "(11) 98765-4321",
};

function erros(values: object) {
  const result = conveniadaSchema.safeParse(values);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("conveniadaSchema", () => {
  it("aceita dados válidos, com nome fantasia vazio", () => {
    expect(conveniadaSchema.safeParse(VALIDO).success).toBe(true);
  });

  it("aceita CNPJ sem máscara", () => {
    expect(conveniadaSchema.safeParse({ ...VALIDO, cnpj: "11222333000181" }).success).toBe(true);
  });

  it("rejeita CNPJ e CPF inválidos", () => {
    expect(erros({ ...VALIDO, cnpj: "11.222.333/0001-82" })).toEqual({ cnpj: "CNPJ inválido" });
    expect(erros({ ...VALIDO, usuarioCpf: "111.111.111-11" })).toEqual({ usuarioCpf: "CPF inválido" });
  });

  it("exige os campos obrigatórios", () => {
    const vazio = erros({
      ...VALIDO,
      cnpj: "",
      razaoSocial: "",
      telefone: "",
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      usuarioNome: "",
      usuarioCpf: "",
      usuarioEmail: "",
      usuarioCelular: "",
    });
    expect(Object.keys(vazio).sort()).toEqual(
      [
        "bairro",
        "cep",
        "cidade",
        "cnpj",
        "estado",
        "logradouro",
        "numero",
        "razaoSocial",
        "telefone",
        "usuarioCelular",
        "usuarioCpf",
        "usuarioEmail",
        "usuarioNome",
      ].sort(),
    );
  });

  it("valida CEP, estado, e-mail e celular", () => {
    expect(erros({ ...VALIDO, cep: "123" })).toEqual({ cep: "CEP inválido" });
    expect(erros({ ...VALIDO, estado: "XX" })).toEqual({ estado: "Estado inválido" });
    expect(erros({ ...VALIDO, usuarioEmail: "maria" })).toEqual({ usuarioEmail: "E-mail inválido" });
    expect(erros({ ...VALIDO, usuarioCelular: "(11) 3456-7890" })).toHaveProperty("usuarioCelular");
  });
});
