import { describe, expect, it } from "vitest";
import { SITUACAO_FATURA } from "@/types/fatura";
import { podeCancelar, podePagar, rotuloSituacao, SITUACOES_FATURA, tomSituacao } from "./situacao";

describe("rotuloSituacao e tomSituacao", () => {
  it("Aberta em alerta, Paga em sucesso e Cancelada neutra, sempre com o texto", () => {
    expect([rotuloSituacao(SITUACAO_FATURA.Aberta), tomSituacao(SITUACAO_FATURA.Aberta)]).toEqual(["Aberta", "warn"]);
    expect([rotuloSituacao(SITUACAO_FATURA.Paga), tomSituacao(SITUACAO_FATURA.Paga)]).toEqual(["Paga", "success"]);
    expect([rotuloSituacao(SITUACAO_FATURA.Cancelada), tomSituacao(SITUACAO_FATURA.Cancelada)]).toEqual(["Cancelada", "neutral"]);
  });

  it("situação nova do back não quebra: texto genérico e tom neutro", () => {
    expect(rotuloSituacao(9)).toBe("Situação desconhecida");
    expect(tomSituacao(9)).toBe("neutral");
  });
});

describe("podePagar e podeCancelar", () => {
  it("só a fatura aberta recebe pagamento ou cancelamento", () => {
    expect(podePagar({ situacao: SITUACAO_FATURA.Aberta })).toBe(true);
    expect(podeCancelar({ situacao: SITUACAO_FATURA.Aberta })).toBe(true);
    for (const situacao of [SITUACAO_FATURA.Paga, SITUACAO_FATURA.Cancelada, 9]) {
      expect(podePagar({ situacao })).toBe(false);
      expect(podeCancelar({ situacao })).toBe(false);
    }
  });
});

describe("SITUACOES_FATURA", () => {
  it("o filtro começa em Todas e tem as três situações", () => {
    expect(SITUACOES_FATURA.map((opcao) => opcao.label)).toEqual(["Todas", "Abertas", "Pagas", "Canceladas"]);
    expect(SITUACOES_FATURA[0].value).toBeNull();
  });
});
