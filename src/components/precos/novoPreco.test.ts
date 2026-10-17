import { describe, expect, it } from "vitest";
import { EMPTY_PRECO_FORM_VALUES } from "@/types/preco";
import { inicioVigenciaDeHoje, novoPrecoFormValues } from "./novoPreco";

describe("novoPreco", () => {
  it("o início da vigência é a data de hoje à meia-noite, no formato do campo", () => {
    expect(inicioVigenciaDeHoje(new Date(2026, 0, 5, 15, 42))).toBe("2026-01-05T00:00");
    expect(inicioVigenciaDeHoje(new Date(2026, 10, 17, 23, 59))).toBe("2026-11-17T00:00");
  });

  it("o cadastro parte dos valores vazios, só com o início preenchido", () => {
    const values = novoPrecoFormValues(new Date(2026, 9, 17, 10, 0));
    expect(values.info).toEqual({ ...EMPTY_PRECO_FORM_VALUES.info, inicioVigencia: "2026-10-17T00:00" });
    expect(values.horarios).toEqual(EMPTY_PRECO_FORM_VALUES.horarios);
    expect(values.faixas).toEqual(EMPTY_PRECO_FORM_VALUES.faixas);
    expect(values.categorias).toEqual(EMPTY_PRECO_FORM_VALUES.categorias);
  });
});
