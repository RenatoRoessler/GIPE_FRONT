import { describe, expect, it } from "vitest";
import { SERVICO_FORM_VAZIO, servicoSchema, toServicoPayload, type CategoriaFormValues, type ServicoFormValues } from "./servico";

// Um serviço válido: nome e valor em todas as categorias.
const valido: ServicoFormValues = {
  ...SERVICO_FORM_VAZIO,
  nome: "Lavagem completa",
  categorias: Object.fromEntries(Object.entries(SERVICO_FORM_VAZIO.categorias).map(([id, linha]) => [id, { ...linha, valor: "50" }])),
};

// Troca campos de uma categoria sem mexer nas outras.
function comCategoria(valores: ServicoFormValues, id: number, parcial: Partial<CategoriaFormValues>): ServicoFormValues {
  return { ...valores, categorias: { ...valores.categorias, [id]: { ...valores.categorias[id], ...parcial } } };
}

// Só as categorias pedidas ligadas, cada uma com seu valor; as outras desligadas.
function soCom(valores: ServicoFormValues, precos: Record<number, string>): ServicoFormValues {
  const categorias = Object.fromEntries(
    Object.entries(valores.categorias).map(([id, linha]) => [id, { ...linha, recebe: id in precos, valor: precos[Number(id)] ?? "" }]),
  );
  return { ...valores, categorias };
}

const mensagens = (valores: ServicoFormValues) => {
  const resultado = servicoSchema.safeParse(valores);
  return resultado.success ? [] : resultado.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
};

describe("servicoSchema", () => {
  it("aceita nome e o valor de todas as categorias ligadas", () => {
    expect(servicoSchema.safeParse(valido).success).toBe(true);
  });

  it("aceita só as categorias com valor, desde que as outras estejam desligadas", () => {
    expect(servicoSchema.safeParse(soCom(valido, { 2: "40,50" })).success).toBe(true);
  });

  it("limita o nome a 100 e a descrição a 255 caracteres", () => {
    expect(mensagens({ ...valido, nome: "a".repeat(101) })).toContain("nome: O nome pode ter até 100 caracteres.");
    expect(servicoSchema.safeParse({ ...valido, nome: "a".repeat(100), descricao: "b".repeat(255) }).success).toBe(true);
    expect(mensagens({ ...valido, descricao: "b".repeat(256) })).toContain("descricao: A descrição pode ter até 255 caracteres.");
  });

  it("exige o nome, já aparado", () => {
    expect(mensagens({ ...valido, nome: "   " })).toContain("nome: Informe o nome do serviço.");
  });

  it("sem nenhuma categoria ligada, pede para ligar ao menos uma", () => {
    expect(mensagens(soCom(valido, {}))).toEqual(["categorias: Deixe ao menos uma categoria ligada."]);
  });

  it("cada categoria ligada precisa do seu valor, e o erro nomeia a categoria", () => {
    const valores = comCategoria(soCom(valido, { 2: "40" }), 3, { recebe: true });
    expect(mensagens(valores)).toEqual(["categorias.3.valor: Informe o valor de Carro médio."]);
  });

  it("não há valor 'para todas': serviço novo e vazio cobra o valor de cada categoria", () => {
    expect(mensagens({ ...SERVICO_FORM_VAZIO, nome: "Cera" })).toHaveLength(6);
  });

  it("rejeita valor zero, negativo, com texto ou com mais de duas casas", () => {
    for (const ruim of ["0", "-5", "abc", "10,555"]) {
      expect(mensagens(comCategoria(valido, 3, { valor: ruim })).join()).toContain("Informe um valor maior que zero");
    }
  });

  it("minutos por categoria aceitam vazio e inteiros, e rejeitam texto ou decimal", () => {
    expect(servicoSchema.safeParse(comCategoria(valido, 1, { duracao: "30", gratis: "" })).success).toBe(true);
    expect(mensagens(comCategoria(valido, 1, { duracao: "x" }))).toContain("categorias.1.duracao: Use só números inteiros.");
    expect(mensagens(comCategoria(valido, 1, { gratis: "1,5" }))).toContain("categorias.1.gratis: Use só números inteiros.");
  });
});

describe("toServicoPayload", () => {
  it("manda os valores em reais, só das categorias ligadas com valor, e só os campos que o back conhece", () => {
    const payload = toServicoPayload(soCom({ ...valido, descricao: " Interna " }, { 2: "40,50", 6: "R$ 80,00" }));

    expect(payload).toEqual({
      nome: "Lavagem completa",
      descricao: "Interna",
      precos: [
        { categoria: 2, valor: 40.5 },
        { categoria: 6, valor: 80 },
      ],
    });
  });

  it("nunca manda a categoria 99 nem os tempos do serviço inteiro (o back recusa e ignora)", () => {
    const payload = toServicoPayload(valido);

    expect(payload.precos.some((preco) => preco.categoria === 99)).toBe(false);
    expect(payload).not.toHaveProperty("duracaoMinutos");
    expect(payload).not.toHaveProperty("tempoPermitidoMinutos");
    expect(payload.precos.map((preco) => preco.categoria)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("categoria desligada não vai, mesmo com valor digitado", () => {
    expect(toServicoPayload(comCategoria(soCom(valido, { 2: "40" }), 3, { recebe: false, valor: "99" })).precos).toEqual([{ categoria: 2, valor: 40 }]);
  });

  it("manda a duração e o tempo grátis de cada categoria, e omite o vazio e o 0", () => {
    const valores = comCategoria(comCategoria(soCom(valido, { 2: "40", 3: "50" }), 2, { duracao: "30", gratis: "60" }), 3, { duracao: "45", gratis: "0" });

    expect(toServicoPayload(valores).precos).toEqual([
      { categoria: 2, valor: 40, duracaoMinutos: 30, tempoPermitidoMinutos: 60 },
      { categoria: 3, valor: 50, duracaoMinutos: 45 },
    ]);
  });

  it("apara o nome e transforma descrição vazia em null", () => {
    expect(toServicoPayload({ ...valido, nome: "  Cera  ", descricao: "   " })).toMatchObject({ nome: "Cera", descricao: null });
    expect(toServicoPayload({ ...valido, descricao: " Interna " }).descricao).toBe("Interna");
  });
});
