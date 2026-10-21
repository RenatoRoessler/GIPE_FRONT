import { describe, expect, it } from "vitest";
import { TIPO_PESSOA } from "@/types/mensalista";
import {
  formatCnpjAlfanumerico,
  formatDocumento,
  formatDocumentoAuto,
  isValidCnpjAlfanumerico,
  isValidDocumentoAuto,
  isValidDocumento,
  normalizeDocumento,
} from "./documento";

describe("normalizeDocumento", () => {
  it("remove a máscara e põe em maiúsculas", () => {
    expect(normalizeDocumento("12.abc.345/0001-95")).toBe("12ABC345000195");
  });
});

describe("CPF", () => {
  it("valida com e sem máscara", () => {
    expect(isValidDocumento("529.982.247-25", TIPO_PESSOA.Fisica)).toBe(true);
    expect(isValidDocumento("52998224725", TIPO_PESSOA.Fisica)).toBe(true);
  });

  it("recusa CPF inválido", () => {
    expect(isValidDocumento("529.982.247-24", TIPO_PESSOA.Fisica)).toBe(false);
    expect(isValidDocumento("111.111.111-11", TIPO_PESSOA.Fisica)).toBe(false);
  });

  it("aplica a máscara de CPF", () => {
    expect(formatDocumento("52998224725", TIPO_PESSOA.Fisica)).toBe("529.982.247-25");
  });
});

describe("CNPJ", () => {
  it("valida CNPJ numérico", () => {
    expect(isValidCnpjAlfanumerico("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpjAlfanumerico("11222333000181")).toBe(true);
  });

  it("recusa CNPJ numérico inválido", () => {
    expect(isValidCnpjAlfanumerico("11.222.333/0001-82")).toBe(false);
    expect(isValidCnpjAlfanumerico("00000000000000")).toBe(false);
  });

  it("valida o CNPJ alfanumérico do exemplo oficial", () => {
    expect(isValidCnpjAlfanumerico("12.ABC.345/01DE-35")).toBe(true);
    expect(isValidCnpjAlfanumerico("12ABC34501DE35")).toBe(true);
  });

  it("recusa CNPJ alfanumérico com dígito errado", () => {
    expect(isValidCnpjAlfanumerico("12ABC34501DE36")).toBe(false);
  });

  it("aceita letras só nas 12 primeiras posições ao mascarar", () => {
    expect(formatCnpjAlfanumerico("12abc34501de35")).toBe("12.ABC.345/01DE-35");
    expect(formatCnpjAlfanumerico("12ABC34501DEXY")).toBe("12.ABC.345/01DE");
  });

  it("mascara parcialmente enquanto digita", () => {
    expect(formatCnpjAlfanumerico("12AB")).toBe("12.AB");
    expect(formatCnpjAlfanumerico("12ABC34")).toBe("12.ABC.34");
  });

  it("usa a máscara de CNPJ para pessoa jurídica", () => {
    expect(formatDocumento("11222333000181", TIPO_PESSOA.Juridica)).toBe("11.222.333/0001-81");
  });
});

describe("formatDocumentoAuto", () => {
  it("usa a máscara de CPF até 11 dígitos", () => {
    expect(formatDocumentoAuto("529")).toBe("529");
    expect(formatDocumentoAuto("5299822")).toBe("529.982.2");
    expect(formatDocumentoAuto("52998224725")).toBe("529.982.247-25");
  });

  it("passa para a máscara de CNPJ com mais de 11 dígitos ou com letras", () => {
    expect(formatDocumentoAuto("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatDocumentoAuto("12ab")).toBe("12.AB");
  });

  it("aceita texto já mascarado", () => {
    expect(formatDocumentoAuto("529.982.247-25")).toBe("529.982.247-25");
  });
});

describe("isValidDocumentoAuto", () => {
  it("aceita CPF e CNPJ válidos, com ou sem máscara", () => {
    expect(isValidDocumentoAuto("529.982.247-25")).toBe(true);
    expect(isValidDocumentoAuto("52998224725")).toBe(true);
    expect(isValidDocumentoAuto("11.222.333/0001-81")).toBe(true);
    expect(isValidDocumentoAuto("12.ABC.345/01DE-35")).toBe(true);
  });

  it("recusa documento inválido, incompleto ou vazio", () => {
    expect(isValidDocumentoAuto("111.111.111-11")).toBe(false);
    expect(isValidDocumentoAuto("529.982.247")).toBe(false);
    expect(isValidDocumentoAuto("11.222.333/0001-82")).toBe(false);
    expect(isValidDocumentoAuto("")).toBe(false);
  });
});
