import { describe, expect, it } from "vitest";
import type { PrecoFaixaValues } from "@/types/preco";
import { avisosFaixas } from "./avisosFaixas";

const faixa = (minutosLimite: string, valor: string): PrecoFaixaValues => ({ minutosLimite, valor, percentualConveniada: "" });

describe("avisosFaixas", () => {
  it("tarifa coerente não tem aviso", () => {
    expect(avisosFaixas([faixa("60", "10,00"), faixa("120", "16,00")], 35)).toEqual([]);
  });

  it("avisa limite de tempo repetido", () => {
    expect(avisosFaixas([faixa("60", "10,00"), faixa("60", "12,00")], 35)).toContain("Duas faixas têm o mesmo limite de tempo.");
  });

  it("avisa degrau que custa menos que o anterior, mesmo fora de ordem", () => {
    const avisos = avisosFaixas([faixa("120", "8,00"), faixa("60", "10,00")], 35);
    expect(avisos).toEqual(["A faixa de 2 h custa menos que a de 1 h."]);
  });

  it("avisa diária menor que o último degrau", () => {
    const avisos = avisosFaixas([faixa("60", "10,00"), faixa("720", "50,00")], 35);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatch(/A diária \(R\$\s35,00\) é menor que o último degrau \(R\$\s50,00\)\./);
  });

  it("ignora linhas incompletas e diária vazia", () => {
    expect(avisosFaixas([faixa("", ""), faixa("60", "abc")], Number.NaN)).toEqual([]);
  });
});
