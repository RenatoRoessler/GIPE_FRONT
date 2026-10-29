import { describe, expect, it } from "vitest";
import type { Caixa, Movimento, Turno } from "@/types/caixa";
import { arredondar, picoDeEntradas, totaisPorForma, totaisPorHora } from "./agregados";
import { calcularGaveta } from "./gaveta";
import { montarLinhaDoTempo } from "./eventosCaixa";
import { contarPorTipo, filtrarMovimentos, FILTRO_PADRAO, filtroAtivo, opcoesDeTurno, paginar, turnosDosMovimentos } from "./movimentos";

let seq = 1;
function mov(extra: Partial<Movimento> = {}): Movimento {
  return {
    movimentoId: seq++,
    dataHora: "2026-10-23T09:00:00",
    tipo: "entrada",
    valor: 10,
    formaPagamento: 1,
    turnoId: 1,
    usuario: "Ana",
    motivo: null,
    ...extra,
  };
}

function turno(extra: Partial<Turno> = {}): Turno {
  return {
    turnoId: 1,
    caixaId: 1,
    usuarioId: 1,
    usuario: "Ana",
    usuarioIdFechamento: null,
    dataHoraInicio: "2026-10-23T08:00:00",
    dataHoraFim: null,
    valorFundoCaixa: 100,
    status: 1,
    saldoCaixa: 0,
    totalEntradas: null,
    totalSaidas: null,
    totalSaida: null,
    saldoCaixaInformado: null,
    totalDiferenca: null,
    observacao: null,
    disponivelSangria: null,
    formasPagamento: [],
    ...extra,
  };
}

const caixa: Caixa = { caixaId: 1, dataHoraAbertura: "2026-10-23T08:00:00", valorFundoCaixa: 100, valorTotalEntrada: 0, valorTotalSaida: 0 };

describe("filtrarMovimentos", () => {
  const lista = [
    mov({ tipo: "entrada", turnoId: 1 }),
    mov({ tipo: "saida", turnoId: 1 }),
    mov({ tipo: "sangria", turnoId: 2 }),
    mov({ tipo: "entrada", turnoId: 2 }),
  ];

  it("sem filtro devolve tudo", () => {
    expect(filtrarMovimentos(lista, FILTRO_PADRAO)).toHaveLength(4);
    expect(filtroAtivo(FILTRO_PADRAO)).toBe(false);
  });

  it("filtra por tipo, por turno e pelos dois juntos", () => {
    expect(filtrarMovimentos(lista, { tipo: "entrada", turnoId: null })).toHaveLength(2);
    expect(filtrarMovimentos(lista, { tipo: "todos", turnoId: 2 })).toHaveLength(2);
    expect(filtrarMovimentos(lista, { tipo: "entrada", turnoId: 2 })).toHaveLength(1);
    expect(filtrarMovimentos(lista, { tipo: "sangria", turnoId: 1 })).toEqual([]);
    expect(filtroAtivo({ tipo: "sangria", turnoId: null })).toBe(true);
    expect(filtroAtivo({ tipo: "todos", turnoId: 2 })).toBe(true);
  });

  it("conta por tipo", () => {
    expect(contarPorTipo(lista)).toEqual({ todos: 4, entrada: 2, saida: 1, sangria: 1 });
    expect(contarPorTipo([])).toEqual({ todos: 0, entrada: 0, saida: 0, sangria: 0 });
  });
});

describe("paginar", () => {
  const itens = Array.from({ length: 45 }, (_, i) => i + 1);

  it("fatia a página pedida", () => {
    const pagina = paginar(itens, 2, 20);
    expect(pagina.itens[0]).toBe(21);
    expect(pagina.itens).toHaveLength(20);
    expect(pagina).toMatchObject({ page: 2, totalPages: 3, totalRecords: 45, pageSize: 20 });
    expect(paginar(itens, 3, 20).itens).toHaveLength(5);
  });

  it("ajusta página fora do intervalo e lista vazia", () => {
    expect(paginar(itens, 99, 20).page).toBe(3);
    expect(paginar(itens, 0, 20).page).toBe(1);
    expect(paginar([], 1, 20)).toMatchObject({ itens: [], page: 1, totalPages: 1, totalRecords: 0 });
  });
});

describe("opcoesDeTurno", () => {
  it("rotula pelo responsável e pelo horário de início", () => {
    const opcoes = opcoesDeTurno([turno({ turnoId: 5, usuario: "Maria" })]);
    expect(opcoes).toHaveLength(1);
    expect(opcoes[0].value).toBe(5);
    expect(opcoes[0].label).toMatch(/^Maria · /);
  });
});

describe("turnosDosMovimentos", () => {
  it("deduz os turnos pelos movimentos, do mais antigo ao mais recente, com o primeiro movimento como início", () => {
    const turnos = turnosDosMovimentos([
      mov({ turnoId: 2, usuario: "Beto", dataHora: "2026-10-23T14:00:00" }),
      mov({ turnoId: 1, usuario: "Ana", dataHora: "2026-10-23T09:30:00" }),
      mov({ turnoId: 1, usuario: "Ana", dataHora: "2026-10-23T09:00:00" }),
      mov({ turnoId: 2, usuario: "Beto", dataHora: "2026-10-23T13:00:00" }),
    ]);
    expect(turnos).toEqual([
      { turnoId: 1, usuario: "Ana", dataHoraInicio: "2026-10-23T09:00:00" },
      { turnoId: 2, usuario: "Beto", dataHoraInicio: "2026-10-23T13:00:00" },
    ]);
  });

  it("ignora movimentos sem turno e lista vazia", () => {
    expect(turnosDosMovimentos([mov({ turnoId: null })])).toEqual([]);
    expect(turnosDosMovimentos([])).toEqual([]);
  });
});

describe("totaisPorForma", () => {
  it("soma entradas e saídas por forma, com dinheiro primeiro", () => {
    const totais = totaisPorForma([
      mov({ formaPagamento: 2, valor: 30 }),
      mov({ formaPagamento: 1, valor: 20 }),
      mov({ formaPagamento: 1, tipo: "saida", valor: 5 }),
      mov({ formaPagamento: 2, tipo: "saida", valor: 10 }),
    ]);
    expect(totais).toEqual([
      { formaPagamento: 1, entradas: 20, saidas: 5, quantidade: 1 },
      { formaPagamento: 2, entradas: 30, saidas: 10, quantidade: 1 },
    ]);
  });

  it("sangria sem forma conta como saída em dinheiro; movimento sem forma e sem ser sangria é ignorado", () => {
    const totais = totaisPorForma([mov({ tipo: "sangria", formaPagamento: null, valor: 50 }), mov({ formaPagamento: null })]);
    expect(totais).toEqual([{ formaPagamento: 1, entradas: 0, saidas: 50, quantidade: 0 }]);
  });

  it("arredonda a duas casas", () => {
    const totais = totaisPorForma([mov({ valor: 0.1 }), mov({ valor: 0.2 })]);
    expect(totais[0].entradas).toBe(0.3);
    expect(arredondar(1.005)).toBe(1.01);
  });

  it("conta uma entrada por movimento; saídas e sangrias não são tickets", () => {
    const totais = totaisPorForma([
      mov({ formaPagamento: 2, valor: 10 }),
      mov({ formaPagamento: 2, valor: 15 }),
      mov({ formaPagamento: 2, tipo: "saida", valor: 5 }),
      mov({ formaPagamento: 1, valor: 20 }),
      mov({ tipo: "sangria", formaPagamento: null, valor: 50 }),
    ]);
    expect(totais.map((total) => [total.formaPagamento, total.quantidade])).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it("lista vazia", () => {
    expect(totaisPorForma([])).toEqual([]);
  });
});

describe("totaisPorHora e picoDeEntradas", () => {
  it("tem 24 posições e soma na hora local", () => {
    const horas = totaisPorHora([
      mov({ dataHora: "2026-10-23T09:10:00", valor: 10 }),
      mov({ dataHora: "2026-10-23T09:50:00", valor: 15 }),
      mov({ dataHora: "2026-10-23T14:00:00", valor: 40 }),
      mov({ dataHora: "2026-10-23T14:30:00", tipo: "saida", valor: 7 }),
      mov({ dataHora: "2026-10-23T23:59:00", tipo: "sangria", valor: 3 }),
    ]);
    expect(horas).toHaveLength(24);
    expect(horas[9]).toEqual({ hora: 9, entradas: 25, saidas: 0 });
    expect(horas[14]).toEqual({ hora: 14, entradas: 40, saidas: 7 });
    expect(horas[23]).toEqual({ hora: 23, entradas: 0, saidas: 3 });
    expect(picoDeEntradas(horas)).toEqual({ hora: 14, valor: 40 });
  });

  it("ignora data inválida; sem entradas não há pico", () => {
    const horas = totaisPorHora([mov({ dataHora: "" }), mov({ tipo: "saida", dataHora: "2026-10-23T10:00:00" })]);
    expect(horas.reduce((soma, item) => soma + item.entradas, 0)).toBe(0);
    expect(picoDeEntradas(horas)).toBeNull();
  });

  it("empate no pico fica com a hora mais cedo", () => {
    const horas = totaisPorHora([mov({ dataHora: "2026-10-23T08:00:00", valor: 20 }), mov({ dataHora: "2026-10-23T16:00:00", valor: 20 })]);
    expect(picoDeEntradas(horas)).toEqual({ hora: 8, valor: 20 });
  });
});

describe("montarLinhaDoTempo", () => {
  it("caixa recém-aberto tem só a abertura", () => {
    const eventos = montarLinhaDoTempo(caixa, [turno()], []);
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ tipo: "abertura", titulo: "Caixa aberto", autor: "Ana" });
    expect(eventos[0].detalhe).toContain("100,00");
  });

  it("junta retiradas e passagens, do mais recente ao mais antigo", () => {
    const eventos = montarLinhaDoTempo(
      caixa,
      [turno({ turnoId: 1, usuario: "Ana", observacao: "tudo certo" }), turno({ turnoId: 2, usuario: "Beto", dataHoraInicio: "2026-10-23T13:00:00" })],
      [
        mov({ tipo: "sangria", valor: 80, motivo: "Cofre", usuario: "Ana", dataHora: "2026-10-23T11:00:00" }),
        mov({ tipo: "entrada", dataHora: "2026-10-23T12:00:00" }),
      ],
    );
    expect(eventos.map((evento) => evento.tipo)).toEqual(["passagem", "retirada", "abertura"]);
    expect(eventos[0]).toMatchObject({ titulo: "Passagem de turno de Ana para Beto", autor: "Beto", detalhe: "tudo certo" });
    expect(eventos[1]).toMatchObject({ detalhe: "Cofre", autor: "Ana" });
    expect(eventos[1].titulo).toContain("80,00");
  });

  it("caixa fechado traz o fechamento no topo", () => {
    const eventos = montarLinhaDoTempo({ ...caixa, dataHoraFechamento: "2026-10-23T18:00:00" }, [turno()], []);
    expect(eventos.map((evento) => evento.tipo)).toEqual(["fechamento", "abertura"]);
  });

  it("no mesmo instante, o evento criado depois aparece antes", () => {
    const eventos = montarLinhaDoTempo(caixa, [turno()], [mov({ tipo: "sangria", dataHora: "2026-10-23T08:00:00" })]);
    expect(eventos.map((evento) => evento.tipo)).toEqual(["retirada", "abertura"]);
  });
});

describe("calcularGaveta", () => {
  const dinheiro = (valorEsperado: number) => ({
    formaPagamento: 1,
    entradas: 0,
    saidas: 0,
    valorEsperado,
    valorInformado: null,
    diferenca: null,
  });

  it("combina fundo e dinheiro esperado e usa o disponível da API", () => {
    const gaveta = calcularGaveta(turno({ valorFundoCaixa: 100, disponivelSangria: 250, formasPagamento: [dinheiro(250)] }));
    expect(gaveta).toEqual({ naGaveta: 350, fica: 100, retiravel: 250 });
  });

  it("sem dinheiro no turno não inventa o total e fica com o fundo", () => {
    const gaveta = calcularGaveta(turno({ valorFundoCaixa: 100, disponivelSangria: null, formasPagamento: [] }));
    expect(gaveta).toEqual({ naGaveta: null, fica: 100, retiravel: null });
  });

  it("valor que não é número nunca vira NaN: o bloco cai em null", () => {
    const quebrado = turno({ valorFundoCaixa: 100, disponivelSangria: Number.NaN, formasPagamento: [dinheiro(Number.NaN)] });
    const gaveta = calcularGaveta(quebrado);
    expect(gaveta.naGaveta).toBeNull();
    expect(gaveta.retiravel).toBeNull();
    expect(gaveta.fica).toBe(100);
  });

  it("sem disponível da API não calcula o que fica a partir do total", () => {
    const gaveta = calcularGaveta(turno({ valorFundoCaixa: 100, disponivelSangria: null, formasPagamento: [dinheiro(50)] }));
    expect(gaveta).toEqual({ naGaveta: 150, fica: 100, retiravel: null });
  });
});
