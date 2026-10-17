import { describe, expect, it } from "vitest";
import { EMPTY_PRECO_FORM_VALUES } from "@/types/preco";
import { toPrecoPayload } from "./preco.mapper";

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
