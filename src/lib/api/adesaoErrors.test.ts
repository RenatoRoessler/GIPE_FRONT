import { describe, expect, it } from "vitest";
import { atribuirErro } from "./adesaoErrors";
import { ApiError } from "./errors";

describe("atribuirErro", () => {
  it("leva o erro de CNPJ para a etapa da empresa", () => {
    const erro = new ApiError("validation", "CNPJ já cadastrado.", 400);
    expect(atribuirErro(erro)).toEqual({
      mensagem: "CNPJ já cadastrado.",
      alvo: { etapa: 1, campo: "cnpj", rotulo: "CNPJ" },
    });
  });

  it("leva o erro de CPF para a etapa do titular", () => {
    const erro = new ApiError("validation", "Dados inválidos.", 400, [{ code: "CPF_DUPLICADO", message: "CPF em uso." }]);
    expect(atribuirErro(erro).alvo).toEqual({ etapa: 3, campo: "cpf", rotulo: "CPF" });
  });

  it("leva o erro de e-mail para a etapa do titular, lendo erros por chave", () => {
    const erro = new ApiError("validation", "Dados inválidos.", 400, { "Usuario.Email": ["Já existe."] });
    expect(atribuirErro(erro).alvo).toEqual({ etapa: 3, campo: "email", rotulo: "e-mail" });
  });

  it("leva o erro de aceite dos termos para a conferência", () => {
    const erro = new ApiError("validation", "Dados inválidos.", 400, { AceiteTermos: ["É necessário aceitar os termos."] });
    expect(atribuirErro(erro).alvo).toEqual({ etapa: 5, campo: "aceiteTermos", rotulo: "Termos de Uso" });
  });

  it("leva o erro de privacidade para o aceite da política", () => {
    const erro = new ApiError("validation", "Aceite a política de privacidade.", 400);
    expect(atribuirErro(erro).alvo).toEqual({ etapa: 5, campo: "aceitePrivacidade", rotulo: "Política de Privacidade" });
  });

  it("não deixa o aceite roubar os erros de CNPJ, CPF e e-mail", () => {
    const erro = new ApiError("validation", "Dados inválidos.", 400, { Cnpj: ["Já existe."], AceiteTermos: ["Obrigatório."] });
    expect(atribuirErro(erro).alvo?.campo).toBe("cnpj");
  });

  it("devolve só a mensagem quando não reconhece o campo", () => {
    const erro = new ApiError("validation", "Dados inválidos.", 400);
    expect(atribuirErro(erro)).toEqual({ mensagem: "Dados inválidos.", alvo: undefined });
  });

  it("mantém a mensagem de rede, timeout e servidor sem alvo", () => {
    for (const kind of ["network", "timeout", "server"] as const) {
      const resultado = atribuirErro(new ApiError(kind));
      expect(resultado.alvo).toBeUndefined();
      expect(resultado.mensagem).toBeTruthy();
    }
  });

  it("trata um erro que não é ApiError", () => {
    expect(atribuirErro(new Error("falhou"))).toEqual({ mensagem: "falhou" });
    expect(atribuirErro("texto")).toEqual({ mensagem: "Ocorreu um erro inesperado." });
  });
});
