import { describe, expect, it } from "vitest";
import { EMPTY_PRECO_FORM_VALUES } from "@/types/preco";
import { toPrecoFormValues, toPrecoPayload } from "./preco.mapper";
import type { PrecoView } from "@/types/preco";

function comFim(fimVigencia: string) {
  return toPrecoPayload({
    ...EMPTY_PRECO_FORM_VALUES,
    info: { ...EMPTY_PRECO_FORM_VALUES.info, inicioVigencia: "2026-10-17T00:00", fimVigencia },
  });
}

describe("toPrecoPayload: fim da vigência", () => {
  it("sem data de fim envia null", () => {
    expect(comFim("").rotatividade.fimVigencia).toBeNull();
  });

  it("com data de fim envia a data com segundos", () => {
    expect(comFim("2026-12-31T23:59").rotatividade.fimVigencia).toBe("2026-12-31T23:59:00");
  });
});

describe("toPrecoPayload: empresa conveniada", () => {
  const comConveniada = (empresaConveniadaId: string) =>
    toPrecoPayload({
      ...EMPTY_PRECO_FORM_VALUES,
      info: { ...EMPTY_PRECO_FORM_VALUES.info, empresaConveniadaId },
    }).rotatividade.empresaConveniadaId;

  it("sem seleção envia null", () => {
    expect(comConveniada("")).toBeNull();
  });

  it("com seleção envia o id numérico", () => {
    expect(comConveniada("12")).toBe(12);
  });

  it("o id volta ao formulário como texto, e null como vazio", () => {
    const view = (empresaConveniadaId: number | null) => ({ regras: [], faixas: [], categorias: [], empresaConveniadaId }) as unknown as PrecoView;
    expect(toPrecoFormValues(view(12)).info.empresaConveniadaId).toBe("12");
    expect(toPrecoFormValues(view(null)).info.empresaConveniadaId).toBe("");
  });
});
