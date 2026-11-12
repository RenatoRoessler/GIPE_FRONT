import { describe, expect, it } from "vitest";
import { SERVICO_FORM_VAZIO, servicoSchema, toServicoPayload, type ServicoFormValues } from "./servico";

const valido: ServicoFormValues = { ...SERVICO_FORM_VAZIO, nome: "Lavagem completa", precoTodas: "50" };

const mensagens = (valores: ServicoFormValues) => {
  const resultado = servicoSchema.safeParse(valores);
  return resultado.success ? [] : resultado.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
};

describe("servicoSchema", () => {
  it("aceita nome e só o preço de todas as categorias", () => {
    expect(servicoSchema.safeParse(valido).success).toBe(true);
  });

  it("aceita só um preço específico, sem o de todas", () => {
    expect(servicoSchema.safeParse({ ...valido, precoTodas: "", precos: { ...valido.precos, 2: "40,50" } }).success).toBe(true);
  });

  it("exige o nome, já aparado", () => {
    expect(mensagens({ ...valido, nome: "   " })).toContain("nome: Informe o nome do serviço.");
  });

  it("exige ao menos um preço", () => {
    expect(mensagens({ ...valido, precoTodas: "" })).toContain("precoTodas: Informe ao menos um preço.");
  });

  it("rejeita preço zero, negativo, com texto ou com mais de duas casas", () => {
    for (const ruim of ["0", "-5", "abc", "10,555"]) {
      expect(mensagens({ ...valido, precoTodas: ruim }).join()).toContain("Informe um valor maior que zero");
    }
  });

  it("rejeita preço específico inválido", () => {
    expect(mensagens({ ...valido, precos: { ...valido.precos, 3: "0" } }).join()).toContain("precos.3");
  });

  it("durações aceitam vazio e inteiros, e rejeitam decimal ou texto", () => {
    expect(servicoSchema.safeParse({ ...valido, duracaoMinutos: "45", tempoPermitidoMinutos: "" }).success).toBe(true);
    expect(mensagens({ ...valido, duracaoMinutos: "4,5" })).toContain("duracaoMinutos: Use só números inteiros.");
    expect(mensagens({ ...valido, tempoPermitidoMinutos: "x" })).toContain("tempoPermitidoMinutos: Use só números inteiros.");
  });
});

describe("toServicoPayload", () => {
  it("manda os valores em reais e descarta os preços vazios", () => {
    const payload = toServicoPayload({
      ...valido,
      precoTodas: "50",
      precos: { 1: "", 2: "40,50", 3: "", 4: "", 5: "", 6: "R$ 80,00" },
    });

    expect(payload.precos).toEqual([
      { categoria: 2, valor: 40.5 },
      { categoria: 6, valor: 80 },
      { categoria: 99, valor: 50 },
    ]);
  });

  it("só 'Todas' vira a categoria 99", () => {
    expect(toServicoPayload(valido).precos).toEqual([{ categoria: 99, valor: 50 }]);
  });

  it("só uma categoria não inclui a 99", () => {
    expect(toServicoPayload({ ...valido, precoTodas: "", precos: { ...valido.precos, 1: "20" } }).precos).toEqual([{ categoria: 1, valor: 20 }]);
  });

  it("tempo permitido 0 vira null; vazio também; duração preenchida segue", () => {
    expect(toServicoPayload({ ...valido, tempoPermitidoMinutos: "0", duracaoMinutos: "60" })).toMatchObject({ tempoPermitidoMinutos: null, duracaoMinutos: 60 });
    expect(toServicoPayload({ ...valido, tempoPermitidoMinutos: "" })).toMatchObject({ tempoPermitidoMinutos: null, duracaoMinutos: null });
    expect(toServicoPayload({ ...valido, tempoPermitidoMinutos: "180" }).tempoPermitidoMinutos).toBe(180);
  });

  it("apara o nome e transforma descrição vazia em null", () => {
    expect(toServicoPayload({ ...valido, nome: "  Cera  ", descricao: "   " })).toMatchObject({ nome: "Cera", descricao: null });
    expect(toServicoPayload({ ...valido, descricao: " Interna " }).descricao).toBe("Interna");
  });
});
