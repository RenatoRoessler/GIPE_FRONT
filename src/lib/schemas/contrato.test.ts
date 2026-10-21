import { describe, expect, it } from "vitest";
import { aceiteSchema } from "./contrato";

function mensagens(values: { aceito: boolean; documento: string }) {
  const result = aceiteSchema.safeParse(values);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

describe("aceiteSchema", () => {
  it("aceita o aceite marcado com CPF ou CNPJ válido", () => {
    expect(aceiteSchema.safeParse({ aceito: true, documento: "529.982.247-25" }).success).toBe(true);
    expect(aceiteSchema.safeParse({ aceito: true, documento: "11.222.333/0001-81" }).success).toBe(true);
  });

  it("exige marcar que leu e concorda", () => {
    expect(mensagens({ aceito: false, documento: "529.982.247-25" })).toEqual({
      aceito: "Marque que leu e concorda com os termos",
    });
  });

  it("pede o documento quando está vazio", () => {
    expect(mensagens({ aceito: true, documento: "" }).documento).toBe("Informe o seu CPF ou CNPJ");
  });

  it("recusa documento inválido ou incompleto", () => {
    expect(mensagens({ aceito: true, documento: "111.111.111-11" }).documento).toBe("Documento inválido. Confira os números");
    expect(mensagens({ aceito: true, documento: "529.982" }).documento).toBe("Documento inválido. Confira os números");
  });
});
