import { describe, expect, it } from "vitest";
import {
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  TIPO_PESSOA,
  type Mensalista,
  type SituacaoMensalista,
} from "@/types/mensalista";
import {
  acaoDoItem,
  acaoEhPrincipal,
  diasEntre,
  filtrarAgenda,
  fimDaSemana,
  formatDiaMes,
  montarAgenda,
  nomeDoDia,
  parseDiaLocal,
  totalDeItens,
} from "./agenda";

// Quarta-feira, 21/10/2026.
const HOJE = new Date(2026, 9, 21, 15, 30);

function mensalista(extra: Partial<Mensalista> & { nome: string }): Mensalista {
  return {
    mensalistaId: Math.floor(Math.random() * 1e9),
    mensalistaTipoId: 1,
    tipoMensal: "Diurno",
    categoria: 99,
    valorMensalidade: 100,
    tipoPessoa: TIPO_PESSOA.Fisica,
    documento: "52998224725",
    email: "a@exemplo.com",
    celular: "11912345678",
    diaVencimento: 5,
    ativo: true,
    veiculos: [],
    situacao: "Em Dia",
    dataProximoVencimento: null,
    diasAteProximoVencimento: null,
    ...extra,
  };
}

const situacaoDe = (m: Mensalista): SituacaoMensalista =>
  m.ativo ? { kind: "ativo" } : m.situacao === SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO ? { kind: "aguardando-pagamento", aceitoEm: null } : { kind: "inativo" };

const ativo = (nome: string, vence: string | null, extra: Partial<Mensalista> = {}) =>
  mensalista({ nome, dataProximoVencimento: vence, ...extra });

function ids(agenda: ReturnType<typeof montarAgenda>) {
  return Object.fromEntries(agenda.grupos.map((grupo) => [grupo.id, grupo.itens.map((item) => item.mensalista.nome)]));
}

describe("parseDiaLocal", () => {
  it("lê só o dia, com ou sem hora, sem deslocar pelo fuso", () => {
    expect(parseDiaLocal("2026-11-05")).toEqual(new Date(2026, 10, 5));
    expect(parseDiaLocal("2026-11-05T00:00:00")).toEqual(new Date(2026, 10, 5));
    expect(parseDiaLocal("2026-11-05T23:59:59.1234567")).toEqual(new Date(2026, 10, 5));
  });

  it("devolve null para ausente, texto ou dia que não existe", () => {
    expect(parseDiaLocal(null)).toBeNull();
    expect(parseDiaLocal("")).toBeNull();
    expect(parseDiaLocal("05/11/2026")).toBeNull();
    expect(parseDiaLocal("2026-02-30")).toBeNull();
  });
});

describe("diasEntre", () => {
  it("conta dias de calendário, ignorando as horas", () => {
    expect(diasEntre(new Date(2026, 9, 21, 23, 59), new Date(2026, 9, 22, 0, 1))).toBe(1);
    expect(diasEntre(new Date(2026, 9, 21), new Date(2026, 9, 15))).toBe(-6);
    expect(diasEntre(new Date(2026, 9, 21, 8), new Date(2026, 9, 21, 20))).toBe(0);
  });

  it("atravessa mês, ano e horário de verão sem errar um dia", () => {
    expect(diasEntre(new Date(2026, 9, 31), new Date(2026, 10, 1))).toBe(1);
    expect(diasEntre(new Date(2026, 11, 31), new Date(2027, 0, 1))).toBe(1);
    expect(diasEntre(new Date(2026, 9, 1), new Date(2026, 10, 15))).toBe(45);
    expect(diasEntre(new Date(2026, 1, 20), new Date(2026, 2, 5))).toBe(13);
  });
});

describe("fimDaSemana", () => {
  it.each([
    ["segunda", new Date(2026, 9, 19), new Date(2026, 9, 25)],
    ["quarta", new Date(2026, 9, 21), new Date(2026, 9, 25)],
    ["sábado", new Date(2026, 9, 24), new Date(2026, 9, 25)],
    ["domingo", new Date(2026, 9, 25), new Date(2026, 9, 25)],
    ["virada de mês", new Date(2026, 9, 28), new Date(2026, 10, 1)],
    ["virada de ano", new Date(2026, 11, 30), new Date(2027, 0, 3)],
  ])("%s", (_nome, hoje, esperado) => {
    expect(fimDaSemana(hoje)).toEqual(esperado);
  });
});

describe("montarAgenda", () => {
  it("classifica cada mensalista no grupo certo", () => {
    const agenda = montarAgenda(
      [
        ativo("Atrasado", "2026-10-15"),
        ativo("Ontem", "2026-10-20"),
        ativo("Hoje", "2026-10-21"),
        ativo("Amanhã", "2026-10-22"),
        ativo("Domingo", "2026-10-25"),
        ativo("Segunda", "2026-10-26"),
        mensalista({ nome: "Sem data", dataProximoVencimento: null }),
        mensalista({ nome: "Primeiro", ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO }),
        mensalista({ nome: "Desativado", ativo: false, situacao: "Inativo" }),
      ],
      situacaoDe,
      HOJE,
    );

    expect(ids(agenda)).toEqual({
      atrasados: ["Atrasado", "Ontem"],
      hoje: ["Hoje"],
      semana: ["Amanhã", "Domingo"],
      "sem-pagamento": ["Primeiro"],
    });
    expect(agenda.emDia).toBe(2);
    expect(agenda.ocultos.map((item) => item.mensalista.nome)).toEqual(["Segunda", "Sem data", "Desativado"]);
  });

  it("calcula os dias de atraso e a situação de cada item", () => {
    const agenda = montarAgenda([ativo("Atrasado", "2026-10-15T00:00:00")], situacaoDe, HOJE);

    expect(agenda.grupos[0].itens[0]).toMatchObject({ grupo: "atrasados", diasAtraso: 6, situacao: { kind: "ativo" } });
    expect(agenda.grupos[0].itens[0].vence).toEqual(new Date(2026, 9, 15));
  });

  it("não mostra grupos vazios", () => {
    expect(montarAgenda([ativo("Só amanhã", "2026-10-22")], situacaoDe, HOJE).grupos.map((g) => g.id)).toEqual(["semana"]);
    expect(montarAgenda([], situacaoDe, HOJE).grupos).toEqual([]);
  });

  it("no sábado só o domingo ainda cabe na semana", () => {
    const sabado = new Date(2026, 9, 24, 9);
    const agenda = montarAgenda([ativo("Domingo", "2026-10-25"), ativo("Segunda", "2026-10-26")], situacaoDe, sabado);

    expect(ids(agenda)).toEqual({ semana: ["Domingo"] });
    expect(agenda.emDia).toBe(1);
  });

  it("no domingo a semana acaba hoje", () => {
    const domingo = new Date(2026, 9, 25, 9);
    const agenda = montarAgenda([ativo("Hoje", "2026-10-25"), ativo("Amanhã", "2026-10-26")], situacaoDe, domingo);

    expect(ids(agenda)).toEqual({ hoje: ["Hoje"] });
    expect(agenda.resumo.ate).toEqual(new Date(2026, 9, 25));
  });

  it("atravessa a virada de mês e de ano", () => {
    const fimDeAno = new Date(2026, 11, 30);
    const agenda = montarAgenda(
      [ativo("Ontem", "2026-12-29"), ativo("Ano novo", "2027-01-01"), ativo("Depois", "2027-01-04")],
      situacaoDe,
      fimDeAno,
    );

    expect(ids(agenda)).toEqual({ atrasados: ["Ontem"], semana: ["Ano novo"] });
    expect(agenda.grupos[0].itens[0].diasAtraso).toBe(1);
  });

  it("ordena atrasados do mais antigo para o mais recente, e hoje e semana por data e nome", () => {
    const agenda = montarAgenda(
      [
        ativo("B", "2026-10-19"),
        ativo("A", "2026-10-19"),
        ativo("C", "2026-10-10"),
        ativo("Sexta", "2026-10-23"),
        ativo("Quinta", "2026-10-22"),
        ativo("Quinta A", "2026-10-22"),
      ],
      situacaoDe,
      HOJE,
    );

    expect(ids(agenda).atrasados).toEqual(["C", "A", "B"]);
    expect(ids(agenda).semana).toEqual(["Quinta", "Quinta A", "Sexta"]);
  });

  it("ordena os que esperam o primeiro pagamento: quem já pode receber vem antes", () => {
    const situacoes: Record<string, SituacaoMensalista> = {
      Pendente: { kind: "aguardando-aceite", expiraEm: null },
      Vencido: { kind: "link-vencido" },
      Aceito: { kind: "aguardando-pagamento", aceitoEm: null },
      Sem: { kind: "sem-contrato" },
      Aceito2: { kind: "aguardando-pagamento", aceitoEm: null },
    };
    const agenda = montarAgenda(
      Object.keys(situacoes).map((nome) =>
        mensalista({ nome, ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO }),
      ),
      (m) => situacoes[m.nome],
      HOJE,
    );

    expect(ids(agenda)["sem-pagamento"]).toEqual(["Aceito", "Aceito2", "Vencido", "Sem", "Pendente"]);
  });

  it("resume só hoje e esta semana, somando a mensalidade", () => {
    const agenda = montarAgenda(
      [
        ativo("Atrasado", "2026-10-15", { valorMensalidade: 900 }),
        ativo("Hoje", "2026-10-21", { valorMensalidade: 280 }),
        ativo("Semana", "2026-10-24", { valorMensalidade: 620.5 }),
        ativo("Depois", "2026-11-05", { valorMensalidade: 1000 }),
        mensalista({ nome: "Primeiro", ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO, valorMensalidade: 50 }),
      ],
      situacaoDe,
      HOJE,
    );

    expect(agenda.resumo).toEqual({ quantidade: 2, total: 900.5, ate: new Date(2026, 9, 25) });
  });
});

describe("filtrarAgenda", () => {
  const agenda = montarAgenda(
    [
      ativo("José da Conceição", "2026-10-15", {
        documento: "52998224725",
        veiculos: [{ placa: "ABC1D23", modelo: "Gol", cor: "PRATA", categoria: 2, condutores: [] }],
      }),
      ativo("Maria Souza", "2026-10-22", { documento: "11222333000181" }),
      ativo("Em dia Silva", "2026-12-10", {
        veiculos: [{ placa: "XYZ9K88", modelo: "Gol", cor: "PRATA", categoria: 2, condutores: [] }],
      }),
      mensalista({ nome: "Desativado Souza", ativo: false, situacao: "Inativo" }),
    ],
    situacaoDe,
    HOJE,
  );

  const nomes = (resultado: typeof agenda) =>
    resultado.grupos.flatMap((grupo) => grupo.itens.map((item) => item.mensalista.nome));

  it("termo vazio devolve a agenda inteira", () => {
    expect(filtrarAgenda(agenda, "")).toBe(agenda);
    expect(filtrarAgenda(agenda, "   ")).toBe(agenda);
  });

  it("acha por nome, ignorando acento e caixa", () => {
    expect(nomes(filtrarAgenda(agenda, "jose conceicao"))).toEqual(["José da Conceição"]);
    expect(nomes(filtrarAgenda(agenda, "JOSÉ"))).toEqual(["José da Conceição"]);
  });

  it("acha por placa, com ou sem hífen, inclusive de quem está em dia", () => {
    expect(nomes(filtrarAgenda(agenda, "abc-1d23"))).toEqual(["José da Conceição"]);
    const emDia = filtrarAgenda(agenda, "xyz9k88");
    expect(nomes(emDia)).toEqual(["Em dia Silva"]);
    expect(emDia.grupos[0]).toMatchObject({ id: "em-dia", titulo: "Em dia" });
  });

  it("acha por documento, mascarado ou não, por prefixo", () => {
    expect(nomes(filtrarAgenda(agenda, "529.982"))).toEqual(["José da Conceição", "Em dia Silva", "Desativado Souza"]);
    expect(nomes(filtrarAgenda(agenda, "11.222.333/0001-81"))).toEqual(["Maria Souza"]);
  });

  it("mostra os inativos num grupo à parte e mantém a ordem dos grupos", () => {
    const resultado = filtrarAgenda(agenda, "souza");

    expect(resultado.grupos.map((grupo) => grupo.id)).toEqual(["semana", "inativos"]);
    expect(totalDeItens(resultado)).toBe(2);
  });

  it("recalcula o resumo sobre o que foi encontrado", () => {
    expect(filtrarAgenda(agenda, "maria").resumo).toMatchObject({ quantidade: 1, total: 100 });
    expect(filtrarAgenda(agenda, "jose").resumo).toMatchObject({ quantidade: 0, total: 0 });
  });

  it("sem resultado devolve os grupos vazios", () => {
    const resultado = filtrarAgenda(agenda, "zzzz");

    expect(resultado.grupos).toEqual([]);
    expect(totalDeItens(resultado)).toBe(0);
  });
});

describe("acaoDoItem", () => {
  const item = (situacao: SituacaoMensalista) => ({ situacao });

  it.each<[SituacaoMensalista, string | null]>([
    [{ kind: "ativo" }, "receber"],
    [{ kind: "inativo" }, "receber"],
    [{ kind: "aguardando-pagamento", aceitoEm: null }, "receber"],
    [{ kind: "desconhecida" }, "receber"],
    [{ kind: "aguardando-aceite", expiraEm: null }, "reenviar"],
    [{ kind: "link-vencido" }, "reenviar"],
    [{ kind: "sem-contrato" }, "enviar-contrato"],
    [{ kind: "carregando" }, null],
  ])("%o -> %s", (situacao, esperado) => {
    expect(acaoDoItem(item(situacao))).toBe(esperado);
  });
});

describe("acaoEhPrincipal", () => {
  it("receber é principal quando urge ou é o primeiro pagamento; reenviar nunca", () => {
    expect(acaoEhPrincipal({ grupo: "atrasados" }, "receber")).toBe(true);
    expect(acaoEhPrincipal({ grupo: "hoje" }, "receber")).toBe(true);
    expect(acaoEhPrincipal({ grupo: "sem-pagamento" }, "receber")).toBe(true);
    expect(acaoEhPrincipal({ grupo: "semana" }, "receber")).toBe(false);
    expect(acaoEhPrincipal({ grupo: "em-dia" }, "receber")).toBe(false);
    expect(acaoEhPrincipal({ grupo: "atrasados" }, "reenviar")).toBe(false);
  });
});

describe("formatDiaMes e nomeDoDia", () => {
  it("formatam o dia com dois dígitos e o dia da semana em português", () => {
    expect(formatDiaMes(new Date(2026, 0, 5))).toBe("05/01");
    expect(formatDiaMes(new Date(2026, 9, 21))).toBe("21/10");
    expect(nomeDoDia(new Date(2026, 9, 25))).toBe("domingo");
    expect(nomeDoDia(new Date(2026, 9, 21))).toBe("quarta");
  });
});
