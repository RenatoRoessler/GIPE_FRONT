import { describe, expect, it } from "vitest";
import type { Caixa, Movimento, Turno } from "@/types/caixa";
import { criarComprovanteTurnoPdf } from "./comprovanteTurnoPdf";
import { criarExtratoPdf } from "./extratoPdf";
import { montarComprovanteTurno, montarExtrato } from "./modelos";

function turno(extra: Partial<Turno> = {}): Turno {
  return {
    turnoId: 7,
    caixaId: 2,
    usuarioId: 1,
    usuario: "Maria",
    usuarioIdFechamento: 1,
    dataHoraInicio: "2026-10-23T08:00:00",
    dataHoraFim: "2026-10-23T18:00:00",
    valorFundoCaixa: 100,
    status: 2,
    saldoCaixa: 400,
    totalEntradas: null,
    totalSaidas: null,
    totalSaida: 50,
    saldoCaixaInformado: 390,
    totalDiferenca: -10,
    observacao: "Faltou um troco",
    disponivelSangria: null,
    formasPagamento: [
      { formaPagamento: 1, entradas: 300, saidas: 0, valorEsperado: 300, valorInformado: 290, diferenca: -10 },
      { formaPagamento: 2, entradas: 150, saidas: 50, valorEsperado: 100, valorInformado: 100, diferenca: 0 },
      { formaPagamento: 4, entradas: 0, saidas: 0, valorEsperado: 0, valorInformado: 5, diferenca: 5 },
    ],
    ...extra,
  };
}

const caixa: Caixa = { caixaId: 2, dataHoraAbertura: "2026-10-23T08:00:00", valorFundoCaixa: 100, valorTotalEntrada: 450, valorTotalSaida: 50 };

function mov(extra: Partial<Movimento> = {}): Movimento {
  return {
    movimentoId: 1,
    dataHora: "2026-10-23T09:00:00",
    tipo: "entrada",
    valor: 25,
    formaPagamento: 2,
    turnoId: 7,
    usuario: "Ana",
    motivo: null,
    ...extra,
  };
}

const ehPdf = (doc: { output: (tipo: "arraybuffer") => ArrayBuffer }) => String.fromCharCode(...new Uint8Array(doc.output("arraybuffer")).slice(0, 5));

describe("montarComprovanteTurno", () => {
  it("fechamento: título, contexto, linhas por forma e total, com diferença em palavras", () => {
    const modelo = montarComprovanteTurno({ tipo: "fechamento", turno: turno(), empresa: { razaoSocial: "Estacionamento Central", cnpj: "66326569000150" } });

    expect(modelo.titulo).toBe("Fechamento de caixa");
    expect(modelo.empresa?.razaoSocial).toBe("Estacionamento Central");
    expect(modelo.contexto.map((item) => item.rotulo)).toEqual(["Caixa", "Responsável pelo turno", "Início", "Fim", "Fundo do turno"]);
    expect(modelo.formas).toEqual([
      { forma: "Dinheiro", esperado: expect.stringContaining("300,00"), informado: expect.stringContaining("290,00"), diferenca: expect.stringMatching(/^Falta .*10,00/) },
      { forma: "Pix", esperado: expect.stringContaining("100,00"), informado: expect.stringContaining("100,00"), diferenca: "Sem diferença" },
      { forma: "Cartão de crédito", esperado: expect.stringContaining("0,00"), informado: expect.stringContaining("5,00"), diferenca: expect.stringMatching(/^Sobra .*5,00/) },
    ]);
    expect(modelo.total.diferenca).toMatch(/^Falta .*10,00/);
    expect(modelo.observacao).toBe("Faltou um troco");
    expect(modelo.assinaturas).toEqual(["Responsável pelo caixa", "Conferência"]);
  });

  it("passagem: título próprio, quem assume e assinaturas de quem entrega e de quem recebe", () => {
    const modelo = montarComprovanteTurno({ tipo: "passagem", turno: turno(), novoResponsavel: "Beto" });

    expect(modelo.titulo).toBe("Passagem de turno");
    expect(modelo.contexto.at(-1)).toEqual({ rotulo: "Assume o turno", valor: "Beto" });
    expect(modelo.assinaturas).toEqual(["Quem entrega o turno", "Quem assume o turno"]);
  });

  it("valores ainda não informados aparecem como traço", () => {
    const modelo = montarComprovanteTurno({
      tipo: "fechamento",
      turno: turno({
        saldoCaixaInformado: null,
        totalDiferenca: null,
        observacao: null,
        dataHoraFim: null,
        formasPagamento: [{ formaPagamento: 1, entradas: 1, saidas: 0, valorEsperado: 1, valorInformado: null, diferenca: null }],
      }),
    });

    expect(modelo.formas[0]).toMatchObject({ informado: "-", diferenca: "-" });
    expect(modelo.total).toMatchObject({ informado: "-", diferenca: "-" });
    expect(modelo.contexto.find((item) => item.rotulo === "Fim")?.valor).toBe("-");
    expect(modelo.observacao).toBeNull();
    expect(modelo.empresa).toBeNull();
  });
});

describe("montarExtrato", () => {
  it("monta linhas com sinal, soma entradas e saídas e informa quem abriu e fechou", () => {
    const modelo = montarExtrato({
      caixa: { ...caixa, dataHoraFechamento: "2026-10-23T18:30:00", abriu: "Ana", fechou: "Beto" },
      movimentos: [mov({ valor: 100 }), mov({ tipo: "saida", valor: 30, formaPagamento: 1 }), mov({ tipo: "sangria", valor: 20, formaPagamento: 1, motivo: "Cofre" })],
      filtro: "Sangrias",
    });

    expect(modelo.linhas).toHaveLength(3);
    expect(modelo.linhas[0].at(-1)).toMatch(/^\+ .*100,00/);
    expect(modelo.linhas[1].at(-1)).toMatch(/^- .*30,00/);
    expect(modelo.linhas[2]).toContain("Cofre");
    expect(modelo.totais.entradas).toContain("100,00");
    expect(modelo.totais.saidas).toContain("50,00");
    expect(modelo.contexto.find((item) => item.rotulo === "Aberto em")?.valor).toContain("por Ana");
    expect(modelo.contexto.find((item) => item.rotulo === "Fechado em")?.valor).toContain("por Beto");
    expect(modelo.filtro).toBe("Sangrias");
  });

  it("caixa aberto ou sem nomes não inventa responsáveis", () => {
    const modelo = montarExtrato({ caixa, movimentos: [] });

    expect(modelo.contexto.find((item) => item.rotulo === "Fechado em")?.valor).toBe("-");
    expect(modelo.contexto.find((item) => item.rotulo === "Aberto em")?.valor).not.toContain("por");
    expect(modelo.linhas).toEqual([]);
    expect(modelo.filtro).toBeNull();
  });
});

describe("criarComprovanteTurnoPdf", () => {
  it("gera um PDF A4 de uma página para o fechamento", async () => {
    const doc = await criarComprovanteTurnoPdf({ tipo: "fechamento", turno: turno(), empresa: { razaoSocial: "Estacionamento Central", cnpj: "66326569000150" } });

    expect(ehPdf(doc)).toBe("%PDF-");
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
  });

  it("gera a passagem de turno sem empresa nem observação", async () => {
    const doc = await criarComprovanteTurnoPdf({ tipo: "passagem", turno: turno({ observacao: null }), novoResponsavel: "Beto" });

    expect(ehPdf(doc)).toBe("%PDF-");
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("aceita caracteres fora do Latin-1 sem quebrar", async () => {
    const doc = await criarComprovanteTurnoPdf({ tipo: "fechamento", turno: turno({ usuario: "Zé — “Chefe”", observacao: "Tudo ok ✓" }) });

    expect(doc.getNumberOfPages()).toBe(1);
  });
});

describe("criarExtratoPdf", () => {
  it("gera uma página para poucos movimentos", async () => {
    const doc = await criarExtratoPdf({ caixa, movimentos: [mov(), mov({ tipo: "saida" })], empresa: { razaoSocial: "Estacionamento Central" } });

    expect(ehPdf(doc)).toBe("%PDF-");
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("quebra em várias páginas quando há muitos movimentos", async () => {
    const muitos = Array.from({ length: 120 }, (_, i) => mov({ movimentoId: i + 1, valor: i + 1, motivo: i % 5 === 0 ? "Recolhimento para o cofre da administração" : null }));
    const doc = await criarExtratoPdf({ caixa, movimentos: muitos, filtro: "Todos" });

    expect(doc.getNumberOfPages()).toBeGreaterThan(2);
  });

  it("sem movimentos ainda gera o documento", async () => {
    const doc = await criarExtratoPdf({ caixa, movimentos: [] });

    expect(doc.getNumberOfPages()).toBe(1);
  });
});
