import { describe, expect, it } from "vitest";
import { CATEGORIAS_SERVICO } from "@/types/servico";
import { aplicarModelo, MODELOS_DE_SERVICO } from "./modelos";

const modelo = (nome: string) => {
  const encontrado = MODELOS_DE_SERVICO.find((item) => item.nome === nome);
  if (!encontrado) throw new Error(`modelo ${nome} não existe`);
  return encontrado;
};

describe("aplicarModelo", () => {
  it("preenche nome, descrição e as seis categorias", () => {
    const valores = aplicarModelo(modelo("Lavagem completa"));
    expect(valores.nome).toBe("Lavagem completa");
    expect(valores.descricao).toBe("Externa, aspiração interna, painel e pretinho nos pneus.");
    expect(Object.keys(valores.categorias).map(Number)).toEqual([...CATEGORIAS_SERVICO]);
  });

  it("deriva o valor pelo fator e arredonda de 5 em 5, em reais com vírgula", () => {
    const { categorias } = aplicarModelo(modelo("Lavagem completa"));
    expect(categorias[2].valor).toBe("70,00");
    expect(categorias[1].valor).toBe("35,00");
    expect(categorias[6].valor).toBe("85,00");
    expect(categorias[4].valor).toBe("90,00");
    expect(categorias[5].valor).toBe("140,00");
  });

  it("a duração não encolhe abaixo de 60% do serviço-base", () => {
    const { categorias } = aplicarModelo(modelo("Lavagem completa"));
    expect(categorias[1].duracao).toBe("35");
    expect(categorias[2].duracao).toBe("60");
    expect(categorias[5].duracao).toBe("120");
  });

  it("repete o tempo grátis em todas as categorias e deixa vazio quando é 0", () => {
    expect(aplicarModelo(modelo("Lavagem simples")).categorias[3].gratis).toBe("60");
    expect(aplicarModelo(modelo("Cera rápida")).categorias[3].gratis).toBe("");
  });

  it("marca como 'não recebe' as categorias que o modelo não atende", () => {
    const { categorias } = aplicarModelo(modelo("Higienização interna"));
    expect(categorias[1]).toEqual({ recebe: false, valor: "", duracao: "", gratis: "" });
    expect(categorias[2].recebe).toBe(true);
  });

  it("todo modelo gera valor maior que zero nas categorias que recebem", () => {
    for (const item of MODELOS_DE_SERVICO) {
      for (const categoria of Object.values(aplicarModelo(item).categorias)) {
        if (categoria.recebe) expect(Number(categoria.valor.replace(",", "."))).toBeGreaterThan(0);
      }
    }
  });
});
