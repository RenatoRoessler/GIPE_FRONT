import { describe, expect, it } from "vitest";
import {
  formatBusca,
  formatCategoria,
  formatDocumentoMensalista,
  formatHorario,
  formatValor,
  formatVencimento,
} from "./format";

describe("formatHorario", () => {
  it("junta entrada e saída", () => {
    expect(formatHorario("07:00", "19:00")).toBe("07:00 – 19:00");
  });

  it("aceita HH:mm:ss", () => {
    expect(formatHorario("07:00:00", "19:00:00")).toBe("07:00 – 19:00");
  });

  it("mostra a saída menor que a entrada como está", () => {
    expect(formatHorario("19:00", "07:00")).toBe("19:00 – 07:00");
  });

  it("usa traço quando não há horário", () => {
    expect(formatHorario(null, null)).toBe("—");
    expect(formatHorario("07:00", null)).toBe("—");
  });
});

describe("formatCategoria", () => {
  it("mostra 'Todas' para o código 99", () => {
    expect(formatCategoria(99)).toBe("Todas");
    expect(formatCategoria(1)).toBe("Moto");
  });
});

describe("formatValor", () => {
  it("formata em reais", () => {
    expect(formatValor(280)).toMatch(/R\$\s?280,00/);
  });
});

describe("formatVencimento", () => {
  it("escreve o dia do mês", () => {
    expect(formatVencimento(5)).toBe("dia 5");
  });
});

describe("formatDocumentoMensalista", () => {
  it("aplica a máscara conforme a pessoa", () => {
    expect(formatDocumentoMensalista({ documento: "52998224725", tipoPessoa: 1 })).toBe("529.982.247-25");
    expect(formatDocumentoMensalista({ documento: "11222333000181", tipoPessoa: 2 })).toBe("11.222.333/0001-81");
  });
});

describe("formatBusca", () => {
  it("usa a máscara de CPF até 11 dígitos", () => {
    expect(formatBusca("529")).toBe("529");
    expect(formatBusca("5299822")).toBe("529.982.2");
    expect(formatBusca("52998224725")).toBe("529.982.247-25");
  });

  it("passa para a máscara de CNPJ com mais de 11 dígitos ou com letras", () => {
    expect(formatBusca("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatBusca("12ab")).toBe("12.AB");
  });

  it("aceita texto já mascarado", () => {
    expect(formatBusca("529.982.247-25")).toBe("529.982.247-25");
  });
});
