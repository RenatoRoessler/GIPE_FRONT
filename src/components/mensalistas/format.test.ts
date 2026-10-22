import { describe, expect, it } from "vitest";
import { TODOS_OS_DIAS } from "@/types/mensalista";
import {
  formatCategoria,
  formatDias,
  formatDocumentoMensalista,
  formatHorario,
  formatValor,
  formatVencimento,
  maskCpfParcial,
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

describe("maskCpfParcial", () => {
  it("mostra só os 3 primeiros e os 2 últimos dígitos", () => {
    expect(maskCpfParcial("52998224725")).toBe("529.***.***-25");
    expect(maskCpfParcial("529.982.247-25")).toBe("529.***.***-25");
  });

  it("não vaza um CPF incompleto", () => {
    expect(maskCpfParcial("529")).toBe("***.***.***-**");
    expect(maskCpfParcial("")).toBe("***.***.***-**");
  });
});

describe("formatDias", () => {
  it("todos os dias", () => {
    expect(formatDias(TODOS_OS_DIAS)).toBe("Todos os dias");
  });

  it("três ou mais dias seguidos viram um intervalo; dois seguidos ficam na lista", () => {
    expect(formatDias({ ...TODOS_OS_DIAS, domingo: false, sabado: false })).toBe("Seg a Sex");
    expect(formatDias({ ...TODOS_OS_DIAS, domingo: false, segunda: false, terca: false, sexta: false, sabado: false })).toBe("Qua, Qui");
  });

  it("dias soltos viram lista", () => {
    expect(formatDias({ ...TODOS_OS_DIAS, domingo: false, terca: false, quinta: false, sexta: false })).toBe("Seg, Qua, Sáb");
  });

  it("sem nenhum dia, traço", () => {
    expect(
      formatDias({ domingo: false, segunda: false, terca: false, quarta: false, quinta: false, sexta: false, sabado: false }),
    ).toBe("—");
  });
});
