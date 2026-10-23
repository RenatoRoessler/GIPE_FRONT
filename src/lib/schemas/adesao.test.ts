import { describe, expect, it } from "vitest";
import { zodFieldErrors } from "@/components/form/zodFieldErrors";
import { EMPTY_PAYMENTS_DATA, MEIOS_PAGAMENTO, type PaymentsData } from "@/types/adesao";
import { adminUserSchema, PAGAMENTOS_MINIMO_MESSAGE, paymentsSchema } from "./adesao";

const NENHUM: PaymentsData = { dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false };

describe("MEIOS_PAGAMENTO e padrão da adesão", () => {
  it("lista os quatro meios na ordem de exibição", () => {
    expect(MEIOS_PAGAMENTO.map((meio) => meio.key)).toEqual(["dinheiro", "pix", "cartaoCredito", "cartaoDebito"]);
    expect(MEIOS_PAGAMENTO.map((meio) => meio.curto)).toEqual(["Dinheiro", "Pix", "Crédito", "Débito"]);
  });

  it("começa só com dinheiro ligado", () => {
    expect(EMPTY_PAYMENTS_DATA).toEqual({ dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false });
    expect(paymentsSchema.safeParse(EMPTY_PAYMENTS_DATA).success).toBe(true);
  });
});

describe("paymentsSchema", () => {
  it.each(MEIOS_PAGAMENTO.map((meio) => meio.key))("aceita só %s ligado", (key) => {
    expect(paymentsSchema.safeParse({ ...NENHUM, [key]: true }).success).toBe(true);
  });

  it("aceita todos ligados", () => {
    expect(
      paymentsSchema.safeParse({ dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true }).success,
    ).toBe(true);
  });

  it("rejeita todos desligados com a mensagem no campo dinheiro", () => {
    const result = paymentsSchema.safeParse(NENHUM);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(1);
    expect(result.error?.issues[0]).toMatchObject({ path: ["dinheiro"], message: PAGAMENTOS_MINIMO_MESSAGE });
  });

  it("gera o erro no formato dos campos do formulário", () => {
    const result = paymentsSchema.safeParse(NENHUM);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodFieldErrors(result)).toEqual({ fields: { dinheiro: PAGAMENTOS_MINIMO_MESSAGE } });
    }
  });

  it("rejeita valores que não são booleanos", () => {
    expect(paymentsSchema.safeParse({ ...NENHUM, pix: "sim" }).success).toBe(false);
  });
});

describe("adminUserSchema: senha com a mesma regra da redefinição", () => {
  const titular = { nome: "Ana Souza", email: "ana@central.com", cpf: "529.982.247-25", celular: "(11) 91234-5678" };
  const comSenha = (senha: string, repetirSenha = senha) => adminUserSchema.safeParse({ ...titular, senha, repetirSenha });
  const mensagemDaSenha = (senha: string) => comSenha(senha).error?.issues.find((issue) => issue.path[0] === "senha")?.message;

  it("aceita uma senha com 8 caracteres, maiúscula, minúscula, número e símbolo", () => {
    expect(comSenha("Senha@123").success).toBe(true);
    expect(comSenha("Abcdef1!").success).toBe(true);
  });

  it.each([
    ["Ab1!", "8 caracteres"],
    ["senha@123", "uma letra maiúscula"],
    ["SENHA@123", "uma letra minúscula"],
    ["Senha@abc", "um número"],
    ["Senha1234", "um símbolo"],
  ])("recusa %s e diz o que falta", (senha, falta) => {
    expect(comSenha(senha).success).toBe(false);
    expect(mensagemDaSenha(senha)).toContain("Falta:");
    expect(mensagemDaSenha(senha)).toContain(falta);
  });

  it("uma senha só com seis dígitos, que a regra antiga aceitava, agora é recusada", () => {
    expect(comSenha("123456").success).toBe(false);
    expect(mensagemDaSenha("123456")).toContain("uma letra maiúscula");
  });

  it("lista tudo o que falta de uma vez, na mesma mensagem da redefinição", () => {
    expect(mensagemDaSenha("abc")).toBe("Falta: 8 caracteres, uma letra maiúscula, um número, um símbolo");
  });

  it("senha vazia pede para informar, sem a lista do que falta", () => {
    expect(mensagemDaSenha("")).toBe("Informe a senha");
  });

  it("exige que a repetição seja igual", () => {
    const resultado = comSenha("Senha@123", "Senha@124");
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues.find((issue) => issue.path[0] === "repetirSenha")?.message).toBe("As senhas não coincidem");
  });
});
