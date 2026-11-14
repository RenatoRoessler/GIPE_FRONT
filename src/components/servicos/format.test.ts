import { describe, expect, it } from "vitest";
import { SERVICOS_DO_VEICULO_KEY, servicosDoVeiculoKey } from "./servicosKeys";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { extensoDeMinutos, formatCentavos, formatCentavosOuGratis, formatDuracao, formatDuracaoNatural, formatTempoPermitido, textoDoComprovante } from "./format";

describe("formatCentavos", () => {
  it("mostra reais com vírgula", () => {
    expect(formatCentavos(4010)).toBe("R$ 40,10");
    expect(formatCentavos(0)).toBe("R$ 0,00");
    expect(formatCentavos(123456)).toBe("R$ 1.234,56");
  });
});

describe("formatDuracao", () => {
  it("abaixo de uma hora só os minutos; de uma hora em diante, também a equivalência", () => {
    expect(formatDuracao(45)).toBe("45 min");
    expect(formatDuracao(90)).toBe("90 min · 1 h 30 min");
    expect(formatDuracao(120)).toBe("120 min · 2 h");
  });

  it("sem valor, traço", () => {
    expect(formatDuracao(null)).toBe("—");
  });
});

describe("formatTempoPermitido", () => {
  it("nulo diz que não há tempo permitido", () => {
    expect(formatTempoPermitido(null)).toBe("Sem tempo permitido");
    expect(formatTempoPermitido(180)).toBe("180 min · 3 h");
  });
});

describe("chaves de consulta", () => {
  it("os serviços do veículo ficam sob a chave do pátio, para a invalidação do pátio os alcançar", () => {
    expect(servicosDoVeiculoKey(30, false).slice(0, PATIO_QUERY_KEY.length)).toEqual([...PATIO_QUERY_KEY]);
    expect(servicosDoVeiculoKey(30, true)).toEqual([...SERVICOS_DO_VEICULO_KEY, 30, true]);
  });
});

describe("formatDuracaoNatural", () => {
  it("diz minutos abaixo de uma hora e horas a partir dela", () => {
    expect(formatDuracaoNatural(40)).toBe("cerca de 40 min");
    expect(formatDuracaoNatural(60)).toBe("cerca de 1h");
    expect(formatDuracaoNatural(90)).toBe("cerca de 1h30");
    expect(formatDuracaoNatural(125)).toBe("cerca de 2h05");
  });

  it("sem duração, devolve vazio", () => {
    expect(formatDuracaoNatural(null)).toBe("");
    expect(formatDuracaoNatural(0)).toBe("");
  });
});

describe("formatCentavosOuGratis", () => {
  it("zero é Grátis e o resto é valor", () => {
    expect(formatCentavosOuGratis(0)).toBe("Grátis");
    expect(formatCentavosOuGratis(3000)).toBe("R$ 30,00");
  });
});

describe("extensoDeMinutos", () => {
  it("escreve horas e minutos por extenso, no singular e no plural", () => {
    expect(extensoDeMinutos(1)).toBe("1 minuto");
    expect(extensoDeMinutos(40)).toBe("40 minutos");
    expect(extensoDeMinutos(60)).toBe("1 hora");
    expect(extensoDeMinutos(90)).toBe("1 hora e 30 minutos");
    expect(extensoDeMinutos(120)).toBe("2 horas");
    expect(extensoDeMinutos(121)).toBe("2 horas e 1 minuto");
  });
});

describe("textoDoComprovante", () => {
  it("diz quanto leva e quanto o carro fica no pátio sem pagar", () => {
    expect(textoDoComprovante({ duracaoMinutos: 60, tempoPermitidoMinutos: 120 })).toEqual({
      previsao: "Após iniciar o serviço, finaliza em cerca de 1 hora.",
      permanencia: "Seu carro pode ficar 2 horas no pátio sem pagar estacionamento. Depois disso, cobra a tabela normal.",
    });
  });

  it("sem duração e sem tempo permitido usa as frases neutras", () => {
    const neutro = { previsao: "Sem previsão de término.", permanencia: "O estacionamento é cobrado normalmente." };
    expect(textoDoComprovante({})).toEqual(neutro);
    expect(textoDoComprovante({ duracaoMinutos: null, tempoPermitidoMinutos: 0 })).toEqual(neutro);
  });
});
