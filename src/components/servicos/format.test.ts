import { describe, expect, it } from "vitest";
import { SERVICOS_DO_VEICULO_KEY, servicosDoVeiculoKey } from "./servicosKeys";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { formatCentavos, formatDuracao, formatTempoPermitido } from "./format";

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
