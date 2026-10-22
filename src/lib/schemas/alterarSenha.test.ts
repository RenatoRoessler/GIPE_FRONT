import { describe, expect, it } from "vitest";
import { alterarSenhaSchema } from "./alterarSenha";

function erros(values: { senhaAtual: string; novaSenha: string; confirmacao: string }) {
  const result = alterarSenhaSchema.safeParse(values);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("alterarSenhaSchema", () => {
  it("aceita senha nova com 6 caracteres, diferente da atual e confirmada", () => {
    expect(alterarSenhaSchema.safeParse({ senhaAtual: "antiga", novaSenha: "abc123", confirmacao: "abc123" }).success).toBe(true);
  });

  it("recusa nova senha com 5 caracteres", () => {
    expect(erros({ senhaAtual: "antiga", novaSenha: "abc12", confirmacao: "abc12" }).novaSenha).toMatch(/ao menos 6/);
  });

  it("recusa nova senha igual à atual", () => {
    expect(erros({ senhaAtual: "abc123", novaSenha: "abc123", confirmacao: "abc123" }).novaSenha).toMatch(/diferente da atual/);
  });

  it("recusa confirmação diferente", () => {
    expect(erros({ senhaAtual: "antiga", novaSenha: "abc123", confirmacao: "abc124" }).confirmacao).toMatch(/não confere/);
  });

  it("exige senha atual e confirmação", () => {
    const e = erros({ senhaAtual: "", novaSenha: "abc123", confirmacao: "" });
    expect(e.senhaAtual).toBe("Informe a senha atual");
    expect(e.confirmacao).toBe("Confirme a nova senha");
  });
});
