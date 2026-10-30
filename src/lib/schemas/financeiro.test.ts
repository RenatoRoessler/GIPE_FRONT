import { describe, expect, it } from "vitest";
import type { CategoriaFormValues, LancamentoFormValues } from "@/types/financeiro";
import { categoriaSchema, createLancamentoSchema, DATA_FUTURA, PELO_CAIXA_SO_DINHEIRO_HOJE, VALOR_LANCAMENTO_INVALIDO } from "./financeiro";

const HOJE = "2026-10-30";
const schema = createLancamentoSchema({ hoje: HOJE });

const valido: LancamentoFormValues = {
  tipo: "2",
  financeiroCategoriaId: "7",
  descricao: "Conta de luz",
  valor: "450,00",
  dataPagamento: "2026-10-22",
  formaPagamento: "2",
  favorecido: "",
  documento: "",
  observacao: "",
  peloCaixa: false,
};

function mensagens(valores: LancamentoFormValues) {
  const resultado = schema.safeParse(valores);
  return resultado.success ? {} : Object.fromEntries(resultado.error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

describe("createLancamentoSchema", () => {
  it("aceita um lançamento completo e um só com o obrigatório", () => {
    expect(schema.safeParse(valido).success).toBe(true);
    expect(schema.safeParse({ ...valido, favorecido: " Cia ", documento: "NF 1", observacao: "x" }).success).toBe(true);
  });

  it("aceita pagar hoje", () => {
    expect(schema.safeParse({ ...valido, dataPagamento: HOJE }).success).toBe(true);
  });

  it("recusa data futura com a mensagem do design", () => {
    expect(mensagens({ ...valido, dataPagamento: "2026-10-31" })).toEqual({ dataPagamento: DATA_FUTURA });
  });

  it("exige a data do pagamento", () => {
    expect(mensagens({ ...valido, dataPagamento: "" })).toEqual({ dataPagamento: "Informe a data do pagamento" });
  });

  it.each(["", "0", "0,00", "abc", "-5", "10,999"])("recusa o valor %j", (valor) => {
    expect(mensagens({ ...valido, valor })).toEqual({ valor: VALOR_LANCAMENTO_INVALIDO });
  });

  it("aceita valor em reais com máscara", () => {
    expect(schema.safeParse({ ...valido, valor: "R$ 1.234,50" }).success).toBe(true);
  });

  it("exige categoria e descrição", () => {
    expect(mensagens({ ...valido, financeiroCategoriaId: "", descricao: "   " })).toEqual({
      financeiroCategoriaId: "Selecione a categoria",
      descricao: "Informe a descrição",
    });
  });

  it("recusa forma de pagamento desconhecida", () => {
    expect(mensagens({ ...valido, formaPagamento: "" })).toEqual({ formaPagamento: "Escolha a forma de pagamento" });
    expect(mensagens({ ...valido, formaPagamento: "9" })).toEqual({ formaPagamento: "Escolha a forma de pagamento" });
  });

  describe("pelo caixa", () => {
    const peloCaixa = { ...valido, formaPagamento: "1", dataPagamento: HOJE, peloCaixa: true };

    it("passa em dinheiro e com a data de hoje", () => {
      expect(schema.safeParse(peloCaixa).success).toBe(true);
    });

    it("recusa com Pix", () => {
      expect(mensagens({ ...peloCaixa, formaPagamento: "2" })).toEqual({ peloCaixa: PELO_CAIXA_SO_DINHEIRO_HOJE });
    });

    it("recusa com data diferente de hoje", () => {
      expect(mensagens({ ...peloCaixa, dataPagamento: "2026-10-22" })).toEqual({ peloCaixa: PELO_CAIXA_SO_DINHEIRO_HOJE });
    });

    it("desligado, não restringe forma nem data", () => {
      expect(schema.safeParse({ ...peloCaixa, formaPagamento: "2", dataPagamento: "2026-10-22", peloCaixa: false }).success).toBe(true);
    });
  });
});

describe("categoriaSchema", () => {
  const valida: CategoriaFormValues = { nome: "Aluguel", tipo: "2", financeiroCategoriaPaiId: "", ativo: true };

  it("aceita com e sem categoria pai", () => {
    expect(categoriaSchema.safeParse(valida).success).toBe(true);
    expect(categoriaSchema.safeParse({ ...valida, financeiroCategoriaPaiId: "3" }).success).toBe(true);
  });

  it("exige o nome, ignorando espaços", () => {
    const resultado = categoriaSchema.safeParse({ ...valida, nome: "   " });
    expect(resultado.success).toBe(false);
    expect(!resultado.success && resultado.error.issues[0].message).toBe("Informe o nome");
  });

  it("recusa nome acima do limite e tipo diferente de 1 ou 2", () => {
    expect(categoriaSchema.safeParse({ ...valida, nome: "a".repeat(101) }).success).toBe(false);
    expect(categoriaSchema.safeParse({ ...valida, tipo: "3" }).success).toBe(false);
    expect(categoriaSchema.safeParse({ ...valida, tipo: "" }).success).toBe(false);
  });
});
