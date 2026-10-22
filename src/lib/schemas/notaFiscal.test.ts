import { describe, expect, it } from "vitest";
import { NOTA_EMAIL_MAX, solicitarNotaSchema } from "./notaFiscal";

const valido = { email: "maria@exemplo.com", pessoaJuridica: false, documento: "" };
const empresa = { ...valido, pessoaJuridica: true };

function erros(entrada: unknown) {
  const result = solicitarNotaSchema.safeParse(entrada);
  const porCampo: Record<string, string> = {};
  if (!result.success) {
    // O formulário mostra a primeira mensagem de cada campo.
    for (const issue of result.error.issues) {
      porCampo[String(issue.path[0])] ??= issue.message;
    }
  }
  return porCampo;
}

describe("solicitarNotaSchema: pessoa física", () => {
  it("aceita só o e-mail, com o CPF vazio", () => {
    expect(solicitarNotaSchema.safeParse(valido).success).toBe(true);
  });

  it("aceita CPF válido, com e sem máscara", () => {
    expect(solicitarNotaSchema.safeParse({ ...valido, documento: "529.982.247-25" }).success).toBe(true);
    expect(solicitarNotaSchema.safeParse({ ...valido, documento: "52998224725" }).success).toBe(true);
  });

  it("recusa CPF inválido, repetido ou incompleto", () => {
    for (const documento of ["111.111.111-11", "529.982.247-24", "123"]) {
      expect(erros({ ...valido, documento }).documento).toBe("CPF inválido");
    }
  });

  it("um CNPJ não vale como CPF", () => {
    expect(erros({ ...valido, documento: "11.222.333/0001-81" }).documento).toBe("CPF inválido");
  });
});

describe("solicitarNotaSchema: pessoa jurídica", () => {
  it("o CNPJ é obrigatório", () => {
    expect(erros({ ...empresa, documento: "" }).documento).toBe("Informe o CNPJ");
    expect(erros({ ...empresa, documento: "   " }).documento).toBe("Informe o CNPJ");
  });

  it("aceita CNPJ válido, com e sem máscara, inclusive o alfanumérico", () => {
    expect(solicitarNotaSchema.safeParse({ ...empresa, documento: "11.222.333/0001-81" }).success).toBe(true);
    expect(solicitarNotaSchema.safeParse({ ...empresa, documento: "11222333000181" }).success).toBe(true);
    expect(solicitarNotaSchema.safeParse({ ...empresa, documento: "12.ABC.345/01DE-35" }).success).toBe(true);
  });

  it("recusa CNPJ inválido, e um CPF não vale como CNPJ", () => {
    expect(erros({ ...empresa, documento: "11.222.333/0001-82" }).documento).toBe("CNPJ inválido");
    expect(erros({ ...empresa, documento: "529.982.247-25" }).documento).toBe("CNPJ inválido");
    expect(erros({ ...empresa, documento: "123" }).documento).toBe("CNPJ inválido");
  });

  it("e-mail inválido e CNPJ ausente aparecem juntos, cada um no seu campo", () => {
    expect(erros({ email: "maria@", pessoaJuridica: true, documento: "" })).toEqual({
      email: "Informe um e-mail válido",
      documento: "Informe o CNPJ",
    });
  });
});

describe("solicitarNotaSchema: e-mail", () => {
  it("é obrigatório, mesmo só com espaços", () => {
    expect(erros({ ...valido, email: "" }).email).toBe("Informe o e-mail");
    expect(erros({ ...valido, email: "   " }).email).toBe("Informe o e-mail");
  });

  it("recusa e-mail fora do formato", () => {
    for (const email of ["maria", "maria@", "maria@exemplo", "ma ria@exemplo.com"]) {
      expect(erros({ ...valido, email }).email).toBe("Informe um e-mail válido");
    }
  });

  it("limita o e-mail a 150 caracteres", () => {
    const limite = `${"a".repeat(NOTA_EMAIL_MAX - "@exemplo.com".length)}@exemplo.com`;
    expect(limite).toHaveLength(NOTA_EMAIL_MAX);
    expect(solicitarNotaSchema.safeParse({ ...valido, email: limite }).success).toBe(true);
    expect(erros({ ...valido, email: `a${limite}` }).email).toBe("Use no máximo 150 caracteres");
  });
});
