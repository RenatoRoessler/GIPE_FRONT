import { describe, expect, it } from "vitest";
import { cpfSchema, novoUsuarioSchema, perfilSchema } from "./usuario";

const valido = {
  cpf: "110.119.540-10",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "(54) 99638-4949",
  perfil: "4",
};

function mensagem(values: object, campo: string) {
  const result = novoUsuarioSchema.safeParse(values);
  return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === campo)?.message;
}

describe("cpfSchema", () => {
  it("aceita CPF válido com e sem máscara", () => {
    expect(cpfSchema.safeParse({ cpf: "110.119.540-10" }).success).toBe(true);
    expect(cpfSchema.safeParse({ cpf: "11011954010" }).success).toBe(true);
  });

  it("recusa CPF vazio e inválido", () => {
    expect(cpfSchema.safeParse({ cpf: "" }).success).toBe(false);
    expect(cpfSchema.safeParse({ cpf: "111.111.111-11" }).success).toBe(false);
  });
});

describe("novoUsuarioSchema", () => {
  it("aceita um cadastro completo", () => {
    expect(novoUsuarioSchema.safeParse(valido).success).toBe(true);
  });

  it("exige os campos obrigatórios", () => {
    expect(mensagem({ ...valido, nome: " " }, "nome")).toBe("Informe o nome");
    expect(mensagem({ ...valido, email: "" }, "email")).toBe("Informe o e-mail");
    expect(mensagem({ ...valido, celular: "" }, "celular")).toBe("Informe o celular");
  });

  it("valida e-mail e celular", () => {
    expect(mensagem({ ...valido, email: "maria@" }, "email")).toBe("E-mail inválido");
    expect(mensagem({ ...valido, celular: "(54) 3963-4949" }, "celular")).toMatch(/Celular inválido/);
  });

  it("limita o tamanho do nome", () => {
    expect(mensagem({ ...valido, nome: "a".repeat(151) }, "nome")).toMatch(/no máximo 150/);
  });

  it("aceita só os perfis do enum", () => {
    expect(novoUsuarioSchema.safeParse({ ...valido, perfil: "8" }).success).toBe(true);
    expect(mensagem({ ...valido, perfil: "5" }, "perfil")).toBe("Selecione o perfil");
    expect(mensagem({ ...valido, perfil: "" }, "perfil")).toBe("Selecione o perfil");
  });
});

describe("perfilSchema", () => {
  it("valida só o perfil", () => {
    expect(perfilSchema.safeParse({ perfil: "2" }).success).toBe(true);
    expect(perfilSchema.safeParse({ perfil: "" }).success).toBe(false);
  });
});
