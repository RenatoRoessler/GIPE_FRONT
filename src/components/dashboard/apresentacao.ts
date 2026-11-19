import type { DefaultTheme } from "styled-components";
import { hrefDoTicket } from "@/components/patio/patioUrl";
import { parseApiDate } from "@/lib/date";
import { AREA, type Area } from "@/lib/permissoes";
import { FORMA_PAGAMENTO } from "@/types/caixa";
import {
  PERIODO_DASHBOARD,
  type Dashboard,
  type DashboardAlertas,
  type DashboardCategoria,
  type DashboardFaixaMovimento,
  type DashboardHora,
  type DashboardMes,
  type DashboardOrigemValores,
  type DashboardPeriodo,
  type DashboardRecebimento,
} from "@/types/dashboard";
import { mesmoDia, somarDias } from "./periodo";
import { MESES, MESES_CURTOS, SEM_VALOR, brl, brlCompacto, capitalizar, dataCurta, diaSemanaCurto, nomeDoMes, percentual, permanencia } from "./format";

// Regras de "o que mostrar" da Visão Geral. Tudo aqui é função pura (sem React, sem `new Date()`): os componentes só desenham o
// que estas funções decidem, e cada caso condicional é testado sem renderizar nada.

// ---------------------------------------------------------------------------------------------------------------------
// Cabeçalho e comparação

export function saudacao(hora: number): string {
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

// "EVERTON SILVA" e "everton silva" viram "Everton". Sem nome, vazio.
export function primeiroNome(nome: string | null | undefined): string {
  const primeiro = (nome ?? "").trim().split(/\s+/)[0] ?? "";
  return primeiro.length > 1 && primeiro === primeiro.toUpperCase() ? capitalizar(primeiro.toLowerCase()) : primeiro;
}

export function saudacaoCompleta(hora: number, nome: string | null | undefined): string {
  const primeiro = primeiroNome(nome);
  return primeiro === "" ? saudacao(hora) : `${saudacao(hora)}, ${primeiro}`;
}

function data(iso: string): Date | null {
  return parseApiDate(iso);
}

// "vs. quinta passada", "vs. mesmo ponto da semana passada", "vs. semana anterior", "vs. out até dia 19" e "vs. outubro".
// Nulo quando não há comparação ou quando o período comparado não faturou (variação nula): a pílula então não aparece.
export function textoComparacao(dashboard: Dashboard, hoje: Date): string | null {
  const { periodo } = dashboard;
  const { comparacao } = periodo;
  if (!comparacao || comparacao.variacaoPercentual === null) return null;
  const inicio = data(comparacao.inicio);
  if (periodo.tipo === PERIODO_DASHBOARD.Dia) {
    if (!inicio) return "vs. a semana passada";
    const diaDaSemana = inicio.getDay();
    const nome = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][diaDaSemana];
    return `vs. ${nome} ${diaDaSemana === 0 || diaDaSemana === 6 ? "passado" : "passada"}`;
  }
  if (periodo.tipo === PERIODO_DASHBOARD.Semana) {
    return periodo.fechado ? "vs. semana anterior" : "vs. mesmo ponto da semana passada";
  }
  return comparacaoDoMes(comparacao, periodo.fechado, hoje);
}

function comparacaoDoMes(comparacao: { inicio: string; fim: string }, fechado: boolean, hoje: Date): string {
  const inicio = data(comparacao.inicio);
  if (!inicio) return "vs. mês anterior";
  if (fechado) return `vs. ${nomeDoMes(inicio, hoje)}`;
  const fim = data(comparacao.fim);
  return `vs. ${MESES_CURTOS[inicio.getMonth()]} até dia ${fim?.getDate() ?? inicio.getDate()}`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Card de faturamento

// "Faturamento hoje", "Faturamento de qua, 18 nov", "Faturamento da semana", "Faturamento do mês" e "Outubro fechou em".
export function rotuloFaturamento(dashboard: Dashboard, hoje: Date): string {
  const { periodo, mes } = dashboard;
  const atual = !periodo.fechado;
  if (periodo.tipo === PERIODO_DASHBOARD.Dia) {
    const dia = data(periodo.inicio);
    return atual || !dia ? "Faturamento hoje" : `Faturamento de ${diaSemanaCurto(dia)}, ${dataCurta(dia, hoje)}`;
  }
  if (periodo.tipo === PERIODO_DASHBOARD.Semana) return "Faturamento da semana";
  const referencia = data(mes.referencia);
  return atual || !referencia ? "Faturamento do mês" : `${capitalizar(nomeDoMes(referencia, hoje))} fechou em`;
}

export type TomIndicador = "neutro" | "alta" | "queda";

export type IndicadorMes = {
  rotulo: string;
  valor: string;
  // O valor é uma mensagem ("Disponível com 5 dias de uso"), não um número: aparece menor e esmaecido.
  espera: boolean;
  subtexto: string | null;
  tom: TomIndicador;
};

const DIAS_PARA_PROJECAO = 5;

function plural(quantidade: number, singular: string, pluralizado: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : pluralizado}`;
}

function variacaoDoMes(dashboard: Dashboard, texto: string): { subtexto: string; tom: TomIndicador } | null {
  const variacao = dashboard.mes.comparacaoMesAnterior?.variacaoPercentual ?? null;
  if (variacao === null) return null;
  return { subtexto: `${variacao >= 0 ? "▲" : "▼"} ${percentual(variacao)} ${texto}`, tom: variacao >= 0 ? "alta" : "queda" };
}

function projecaoDoMes(dashboard: Dashboard, inicioUso: Date | null, referencia: Date | null): IndicadorMes {
  const { mes } = dashboard;
  const rotulo = "Projeção do mês";
  if (mes.projecao !== null) {
    const usoNoMes = inicioUso && referencia && inicioUso >= referencia;
    const subtexto =
      mes.fechamentoMesAnterior !== null && referencia
        ? `${MESES[(referencia.getMonth() + 11) % 12]} fechou ${brl(mes.fechamentoMesAnterior)}`
        : usoNoMes
          ? `estimativa com base em ${plural(mes.diasDeUso, "dia", "dias")}`
          : null;
    return { rotulo, valor: brl(mes.projecao), espera: false, subtexto, tom: "neutro" };
  }
  if (mes.diasDeUso < DIAS_PARA_PROJECAO) {
    const faltam = Math.max(1, DIAS_PARA_PROJECAO - mes.diasDeUso);
    return {
      rotulo,
      valor: `Disponível com ${DIAS_PARA_PROJECAO} dias de uso`,
      espera: true,
      subtexto: `faltam ${plural(faltam, "dia", "dias")} de uso`,
      tom: "neutro",
    };
  }
  return { rotulo, valor: SEM_VALOR, espera: false, subtexto: null, tom: "neutro" };
}

// As duas colunas abaixo do faturamento: dependem de o mês estar em andamento ou fechado e de o período ser o mês ou não.
export function indicadoresDoMes(dashboard: Dashboard, hoje: Date): IndicadorMes[] {
  const { mes, periodo } = dashboard;
  const referencia = data(mes.referencia);
  const inicioUso = data(dashboard.inicioUso ?? "");
  const noMes = periodo.tipo === PERIODO_DASHBOARD.Mes;
  const mediaPorDia = (subtexto: string | null): IndicadorMes => ({
    rotulo: "Média por dia",
    valor: brl(mes.mediaPorDia),
    espera: false,
    subtexto: mes.mediaPorDia === null ? null : subtexto,
    tom: "neutro",
  });

  if (!mes.fechado) {
    if (noMes) {
      return [mediaPorDia(`em ${plural(mes.diasDeUso, "dia", "dias")} de uso no mês`), projecaoDoMes(dashboard, inicioUso, referencia)];
    }
    const abreviado = mes.comparacaoMesAnterior ? data(mes.comparacaoMesAnterior.inicio) : null;
    const fimComparado = mes.comparacaoMesAnterior ? data(mes.comparacaoMesAnterior.fim) : null;
    const variacao =
      abreviado && fimComparado ? variacaoDoMes(dashboard, `vs. ${MESES_CURTOS[abreviado.getMonth()]} até dia ${fimComparado.getDate()}`) : null;
    const desde = !variacao && inicioUso && referencia && inicioUso >= referencia ? `desde ${dataCurta(inicioUso, hoje)}` : null;
    return [
      {
        rotulo: "Mês até agora",
        valor: brl(mes.faturado),
        espera: false,
        subtexto: variacao?.subtexto ?? desde,
        tom: variacao?.tom ?? "neutro",
      },
      projecaoDoMes(dashboard, inicioUso, referencia),
    ];
  }

  if (noMes) {
    const melhor = mes.melhorDia;
    const melhorData = melhor ? data(melhor.data) : null;
    return [
      mediaPorDia(`${plural(mes.diasDeUso, "dia", "dias")} com movimento`),
      {
        rotulo: "Melhor dia",
        valor: melhor ? brl(melhor.faturamento) : SEM_VALOR,
        espera: false,
        subtexto: melhorData ? `${diaSemanaCurto(melhorData)}, ${dataCurta(melhorData, hoje)}` : null,
        tom: "neutro",
      },
    ];
  }

  // Dia ou semana dentro de um mês já fechado.
  const anterior = mes.comparacaoMesAnterior ? data(mes.comparacaoMesAnterior.inicio) : null;
  const variacao = anterior ? variacaoDoMes(dashboard, `vs. ${MESES[anterior.getMonth()]}`) : null;
  const nome = referencia ? nomeDoMes(referencia, hoje) : "mês";
  return [
    {
      rotulo: `${capitalizar(nome)} fechou em`,
      valor: brl(mes.faturado),
      espera: false,
      subtexto: variacao?.subtexto ?? null,
      tom: variacao?.tom ?? "neutro",
    },
    mediaPorDia(`no mês de ${referencia ? MESES[referencia.getMonth()] : "referência"}`),
  ];
}

// ---------------------------------------------------------------------------------------------------------------------
// Pendências

export type TomPendencia = "danger" | "caution" | "info";
export type IconePendencia = "alerta" | "caixa" | "relogio" | "agenda" | "doc";

export type Pendencia = {
  id: "inadimplentes" | "caixa" | "parados" | "aVencer" | "faturas";
  tom: TomPendencia;
  icone: IconePendencia;
  titulo: string;
  resumo: string;
  quantidade: number;
  // Nulo quando o usuário não tem acesso à tela que resolve a pendência: a linha aparece, mas não é um link.
  href: string | null;
};

const FILTROS_VAZIOS = { busca: "", tipo: "todos", categoria: "todas" } as const;

function tempoParado(horas: number): string {
  return horas > 0 && horas % 24 === 0 ? plural(horas / 24, "dia", "dias") : plural(horas, "hora", "horas");
}

function resumoDoCaixa(quantidade: number, valor: number): string {
  const turnos = `${plural(quantidade, "turno", "turnos")} nos últimos 7 dias`;
  if (valor === 0) return turnos;
  return `${turnos} · ${valor < 0 ? "Falta" : "Sobra"} ${brl(Math.abs(valor), { centavos: true })}`;
}

// Da mais grave para a menos grave. Só as pendências que existem; sem nenhuma, lista vazia ("Tudo em dia").
export function pendencias(alertas: DashboardAlertas | null, podeAcessar: (area: Area) => boolean): Pendencia[] {
  if (!alertas) return [];
  const destino = (area: Area, href: string) => (podeAcessar(area) ? href : null);
  const itens: Pendencia[] = [];

  const inadimplentes = alertas.mensalistasInadimplentes;
  if (inadimplentes) {
    itens.push({
      id: "inadimplentes",
      tom: "danger",
      icone: "alerta",
      titulo: "Mensalistas inadimplentes",
      resumo: `${brlCompacto(inadimplentes.valor)} em atraso`,
      quantidade: inadimplentes.quantidade,
      href: destino(AREA.Mensalistas, "/mensalistas?aba=lista"),
    });
  }

  const caixas = alertas.caixasComDiferenca;
  if (caixas) {
    itens.push({
      id: "caixa",
      tom: "danger",
      icone: "caixa",
      titulo: "Caixa fechado com diferença",
      resumo: resumoDoCaixa(caixas.quantidade, caixas.valor),
      quantidade: caixas.quantidade,
      href: destino(AREA.CaixaHistorico, "/caixa/historico"),
    });
  }

  const parados = alertas.veiculosParados;
  if (parados) {
    const antigo = parados.maisAntigo;
    itens.push({
      id: "parados",
      tom: "caution",
      icone: "relogio",
      titulo: `Veículos há mais de ${tempoParado(parados.horasMinimas)}`,
      resumo: antigo ? `Mais antigo: ${antigo.placa} · ${permanencia(antigo.permanenciaMinutos)}` : "Avulsos parados no pátio",
      quantidade: parados.quantidade,
      href: destino(AREA.Patio, antigo ? hrefDoTicket(antigo.idPatio, FILTROS_VAZIOS) : "/patio"),
    });
  }

  const aVencer = alertas.mensalidadesAVencer;
  if (aVencer) {
    itens.push({
      id: "aVencer",
      tom: "caution",
      icone: "agenda",
      titulo: "Mensalidades vencem em 5 dias",
      resumo: `${brlCompacto(aVencer.valor)} a receber`,
      quantidade: aVencer.quantidade,
      href: destino(AREA.Mensalistas, "/mensalistas"),
    });
  }

  const faturas = alertas.faturasConveniadaAbertas;
  if (faturas) {
    itens.push({
      id: "faturas",
      tom: "info",
      icone: "doc",
      titulo: "Faturas de conveniadas abertas",
      resumo: `${brlCompacto(faturas.valor)} a receber`,
      quantidade: faturas.quantidade,
      href: destino(AREA.Faturas, "/faturas"),
    });
  }

  return itens;
}

// ---------------------------------------------------------------------------------------------------------------------
// Distribuições (origem e forma de recebimento)

// Caminho da cor no tema: as origens usam as cores de tipo de cliente e as formas de pagamento, as mesmas do Caixa e do Pátio.
export type CorDistribuicao =
  | "cliente.avulso"
  | "cliente.mensal"
  | "cliente.conveniado"
  | "primary"
  | "pagamento.dinheiro"
  | "pagamento.pix"
  | "pagamento.debito"
  | "pagamento.credito"
  | "steel";

export type LinhaDistribuicao = {
  chave: string;
  nome: string;
  valor: number;
  // 0 a 100, sem arredondar: quem desenha arredonda para exibir.
  percentual: number;
  cor: CorDistribuicao;
};

export type Distribuicao = { linhas: LinhaDistribuicao[]; total: number };

export function corDoTema(cores: DefaultTheme["colors"], cor: CorDistribuicao): string {
  switch (cor) {
    case "cliente.avulso":
      return cores.cliente.avulso;
    case "cliente.mensal":
      return cores.cliente.mensal;
    case "cliente.conveniado":
      return cores.cliente.conveniado;
    case "pagamento.dinheiro":
      return cores.pagamento.dinheiro;
    case "pagamento.pix":
      return cores.pagamento.pix;
    case "pagamento.debito":
      return cores.pagamento.debito;
    case "pagamento.credito":
      return cores.pagamento.credito;
    case "steel":
      return cores.steel;
    case "primary":
      return cores.primary;
  }
}

function distribuir(linhas: Omit<LinhaDistribuicao, "percentual">[]): Distribuicao {
  const comValor = linhas.filter((linha) => linha.valor > 0);
  const total = comValor.reduce((soma, linha) => soma + linha.valor, 0);
  return { linhas: comValor.map((linha) => ({ ...linha, percentual: (linha.valor / total) * 100 })), total };
}

// Avulso, Mensalistas, Convênios e Lava-rápido. Origem nula (sem valor no mês) não aparece.
export function distribuicaoOrigem(origem: Dashboard["origem"]): Distribuicao {
  return distribuir([
    { chave: "avulso", nome: "Avulso", valor: origem.avulso ?? 0, cor: "cliente.avulso" },
    { chave: "mensalista", nome: "Mensalistas", valor: origem.mensalista ?? 0, cor: "cliente.mensal" },
    { chave: "convenio", nome: "Convênios", valor: origem.convenio ?? 0, cor: "cliente.conveniado" },
    { chave: "lavaRapido", nome: "Lava-rápido", valor: origem.lavaRapido ?? 0, cor: "primary" },
  ]);
}

function corDaForma(forma: number): CorDistribuicao {
  switch (forma) {
    case FORMA_PAGAMENTO.Dinheiro:
      return "pagamento.dinheiro";
    case FORMA_PAGAMENTO.Pix:
      return "pagamento.pix";
    case FORMA_PAGAMENTO.CartaoDebito:
      return "pagamento.debito";
    case FORMA_PAGAMENTO.CartaoCredito:
      return "pagamento.credito";
    default:
      return "steel";
  }
}

// Usa o nome que a API manda (PIX, Dinheiro, Cartão de débito…), na ordem recebida. Forma sem cor própria usa `steel`.
export function distribuicaoRecebimento(recebimento: DashboardRecebimento[]): Distribuicao {
  return distribuir(
    recebimento.map((linha) => ({ chave: `forma-${linha.formaPagamento}`, nome: linha.descricao, valor: linha.valor, cor: corDaForma(linha.formaPagamento) })),
  );
}

// "De onde vem o dinheiro" e "Como você recebe" olham para o mês que contém o fim do período: quando ele não é o atual, o título
// diz qual é ("De onde vem o dinheiro · outubro").
export function tituloDoMes(base: string, mes: DashboardMes, hoje: Date): string {
  const referencia = data(mes.referencia);
  return mes.fechado && referencia ? `${base} · ${nomeDoMes(referencia, hoje)}` : base;
}

// ---------------------------------------------------------------------------------------------------------------------
// Por categoria

export type LinhaCategoria = {
  categoria: string;
  saidas: number;
  valor: number;
  // 0 a 1, em relação à categoria com mais saídas: é a largura do trilho.
  proporcao: number;
};

// Da categoria com mais saídas para a com menos (empate: a de maior valor); só as que têm valor.
export function linhasDeCategoria(categorias: DashboardCategoria[]): LinhaCategoria[] {
  const comValor = categorias.filter((linha) => linha.valor > 0).sort((a, b) => b.saidas - a.saidas || b.valor - a.valor);
  const maior = comValor[0]?.saidas ?? 0;
  return comValor.map((linha) => ({ ...linha, proporcao: maior > 0 ? linha.saidas / maior : 0 }));
}

export function totalDeCategorias(linhas: LinhaCategoria[]): { saidas: number; valor: number } {
  return { saidas: linhas.reduce((soma, linha) => soma + linha.saidas, 0), valor: linhas.reduce((soma, linha) => soma + linha.valor, 0) };
}

// "saídas do dia", "saídas da semana" ou "saídas do mês".
export function rotuloDasSaidas(tipo: Dashboard["periodo"]["tipo"]): string {
  if (tipo === PERIODO_DASHBOARD.Semana) return "saídas da semana";
  return tipo === PERIODO_DASHBOARD.Mes ? "saídas do mês" : "saídas do dia";
}

// ---------------------------------------------------------------------------------------------------------------------
// Faturamento por dia

export type ChaveOrigem = keyof DashboardOrigemValores;

// De baixo para cima na coluna empilhada, e na legenda.
export const ORIGENS: readonly { chave: ChaveOrigem; nome: string; cor: CorDistribuicao }[] = [
  { chave: "avulso", nome: "Avulso", cor: "cliente.avulso" },
  { chave: "mensalista", nome: "Mensalista", cor: "cliente.mensal" },
  { chave: "convenio", nome: "Convênio", cor: "cliente.conveniado" },
  { chave: "lavaRapido", nome: "Lava-rápido", cor: "primary" },
];

export type DestaqueDoDia = "normal" | "selecionado" | "esmaecido";

export type ColunaDiaria = {
  data: Date;
  // Nulo nos dias antes do início do uso: a coluna vira uma lacuna tracejada, não um zero.
  valores: DashboardOrigemValores | null;
  total: number;
  destaque: DestaqueDoDia;
};

export type GraficoDiario = {
  titulo: string;
  colunas: ColunaDiaria[];
  // O maior total entre os dias: a altura de cada coluna é relativa a ele.
  maximo: number;
  // Só as origens que tiveram valor no recorte.
  legenda: { chave: ChaveOrigem; nome: string; cor: CorDistribuicao }[];
  // Primeiro dia, dia do meio e último dia ("Hoje" quando é hoje).
  eixo: [string, string, string];
  // Texto para leitor de tela: o que o gráfico mostra, em uma frase.
  resumo: string;
  // Sem nenhum dia com uso: mostra a frase de vazio no lugar do gráfico.
  vazio: boolean;
};

function totalDoDia(valores: DashboardOrigemValores): number {
  return valores.avulso + valores.mensalista + valores.convenio + valores.lavaRapido;
}

function destaqueDoDia(dia: Date, dashboard: Dashboard, hoje: Date): DestaqueDoDia {
  const { periodo, mes } = dashboard;
  const inicio = data(periodo.inicio);
  const fim = data(periodo.fim);
  if (periodo.tipo === PERIODO_DASHBOARD.Mes) {
    // Mês fechado: sem destaque. Mês em andamento: só hoje.
    return !mes.fechado && mesmoDia(dia, hoje) ? "selecionado" : "normal";
  }
  const dentro = inicio !== null && fim !== null && dia >= inicio && dia <= fim;
  if (!dentro) return "esmaecido";
  return periodo.tipo === PERIODO_DASHBOARD.Dia ? "selecionado" : "normal";
}

// O recorte do gráfico vem pronto da API: os dias do mês, se o mês fechou; senão os 30 dias até o fim do período. As datas dos dias
// antes do início do uso vêm nulas, então são recontadas a partir do último dia (a série é contínua).
export function graficoDiario(dashboard: Dashboard, hoje: Date): GraficoDiario {
  const dias = dashboard.faturamentoDiario;
  const ultimoComUso = dias.findLastIndex((dia) => dia !== null);
  const dataDoUltimo = ultimoComUso >= 0 ? data(dias[ultimoComUso]!.data) : null;
  const vazio = dashboard.inicioUso === null || dataDoUltimo === null;

  const referencia = data(dashboard.mes.referencia);
  const colunas: ColunaDiaria[] = vazio
    ? []
    : dias.map((dia, indice) => {
        const dataDoDia = somarDias(dataDoUltimo!, indice - ultimoComUso);
        const valores = dia ? { avulso: dia.avulso, mensalista: dia.mensalista, convenio: dia.convenio, lavaRapido: dia.lavaRapido } : null;
        return { data: dataDoDia, valores, total: valores ? totalDoDia(valores) : 0, destaque: destaqueDoDia(dataDoDia, dashboard, hoje) };
      });

  const ultima = colunas.length > 0 ? colunas[colunas.length - 1].data : null;
  const ateHoje = ultima !== null && mesmoDia(ultima, hoje);
  const titulo =
    dashboard.mes.fechado && referencia
      ? `Faturamento por dia · ${nomeDoMes(referencia, hoje)}`
      : `Faturamento · 30 dias até ${ultima === null || ateHoje ? "hoje" : dataCurta(ultima, hoje)}`;

  const somas = ORIGENS.map((origem) => ({ origem, soma: colunas.reduce((total, coluna) => total + (coluna.valores?.[origem.chave] ?? 0), 0) }));
  const total = somas.reduce((acumulado, { soma }) => acumulado + soma, 0);
  const maximo = colunas.reduce((maior, coluna) => Math.max(maior, coluna.total), 0);
  const melhor = colunas.reduce<ColunaDiaria | null>((atual, coluna) => (coluna.valores && coluna.total > (atual?.total ?? 0) ? coluna : atual), null);
  const meio = colunas[Math.floor(colunas.length / 2)];

  const rotuloDoDia = (coluna: ColunaDiaria) => (mesmoDia(coluna.data, hoje) ? "Hoje" : dataCurta(coluna.data, hoje));
  const eixo: [string, string, string] =
    colunas.length === 0 ? ["", "", ""] : [dataCurta(colunas[0].data, hoje), dataCurta(meio.data, hoje), rotuloDoDia(colunas[colunas.length - 1])];

  const resumo =
    colunas.length === 0
      ? "Ainda não há dias com saídas registradas."
      : `Faturamento de ${dataCurta(colunas[0].data, hoje)} a ${dataCurta(colunas[colunas.length - 1].data, hoje)}: ${
          total > 0 ? `total de ${brl(total)}` : "sem faturamento"
        }${melhor ? `, melhor dia ${diaSemanaCurto(melhor.data)}, ${dataCurta(melhor.data, hoje)}, com ${brl(melhor.total)}` : ""}.`;

  return {
    titulo,
    colunas,
    maximo,
    legenda: somas.filter(({ soma }) => soma > 0).map(({ origem }) => ({ chave: origem.chave, nome: origem.nome, cor: origem.cor })),
    eixo,
    resumo,
    vazio,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Veículos no pátio por hora

// "Veículos no pátio por hora · hoje", "· qua, 18 nov", "· média da semana" ou "· média do mês".
export function tituloPorHora(periodo: DashboardPeriodo, hoje: Date): string {
  const base = "Veículos no pátio por hora";
  if (periodo.tipo === PERIODO_DASHBOARD.Semana) return `${base} · média da semana`;
  if (periodo.tipo === PERIODO_DASHBOARD.Mes) return `${base} · média do mês`;
  const dia = data(periodo.inicio);
  return !periodo.fechado || !dia ? `${base} · hoje` : `${base} · ${diaSemanaCurto(dia)}, ${dataCurta(dia, hoje)}`;
}

export const HORAS_DA_JANELA = 3;

export type GrupoHora = {
  // Primeira hora do grupo e a hora em que ele termina (22h–24h no último grupo de 2 horas).
  hora: number;
  horaFim: number;
  // Média dos veículos no pátio e soma das entradas, arredondadas. Sem hora conhecida, o grupo é vazio (ainda não chegou).
  veiculos: number;
  entradas: number;
  vazio: boolean;
};

// Agrupa as 24 horas de `passo` em `passo` (1 ou 2): média dos veículos e soma das entradas. Grupo sem nenhuma hora conhecida
// fica vazio.
export function agruparHoras(horas: (DashboardHora | null)[], passo: number): GrupoHora[] {
  const tamanho = Math.max(1, Math.floor(passo));
  const grupos: GrupoHora[] = [];
  for (let inicio = 0; inicio < 24; inicio += tamanho) {
    const conhecidas = horas.slice(inicio, inicio + tamanho).filter((hora): hora is DashboardHora => hora !== null);
    const base = { hora: inicio, horaFim: Math.min(inicio + tamanho, 24) };
    grupos.push(
      conhecidas.length === 0
        ? { ...base, veiculos: 0, entradas: 0, vazio: true }
        : {
            ...base,
            veiculos: Math.round(conhecidas.reduce((soma, hora) => soma + hora.veiculos, 0) / conhecidas.length),
            entradas: Math.round(conhecidas.reduce((soma, hora) => soma + hora.entradas, 0)),
            vazio: false,
          },
    );
  }
  return grupos;
}

// A hora pertence à faixa de 3 horas de maior movimento (a faixa pode virar o dia).
export function horaNaFaixa(hora: number, faixa: DashboardFaixaMovimento | null): boolean {
  return faixa !== null && (hora - faixa.inicio + 24) % 24 < HORAS_DA_JANELA;
}

// O grupo aparece em destaque quando qualquer uma de suas horas está na faixa de maior movimento.
export function grupoNaFaixa(grupo: GrupoHora, faixa: DashboardFaixaMovimento | null): boolean {
  for (let hora = grupo.hora; hora < grupo.horaFim; hora += 1) {
    if (horaNaFaixa(hora, faixa)) return true;
  }
  return false;
}

// "11h – 14h", como a API mandou a faixa.
export function textoFaixa(faixa: DashboardFaixaMovimento): string {
  return `${faixa.inicio}h – ${faixa.fim}h`;
}

// A hora que abre selecionada: a hora atual quando se olha para hoje; senão a hora seguinte ao início do maior movimento (ou
// meio-dia). Alinhada ao grupo e, se o grupo estiver vazio, a última hora que já chegou. Nulo quando nenhuma hora chegou.
export function horaInicialDoGrafico(grupos: GrupoHora[], faixaMaior: DashboardFaixaMovimento | null, horaAtual: number | null): number | null {
  const passo = grupos.length > 1 ? grupos[1].hora - grupos[0].hora : 1;
  const desejada = horaAtual ?? (faixaMaior ? (faixaMaior.inicio + 1) % 24 : 12);
  const alinhada = desejada - (desejada % passo);
  const escolhido = grupos.find((grupo) => grupo.hora === alinhada && !grupo.vazio);
  if (escolhido) return escolhido.hora;
  const ultimo = [...grupos].reverse().find((grupo) => !grupo.vazio);
  return ultimo ? ultimo.hora : null;
}

export type DetalheDaHora = { titulo: string; veiculos: string; entradas: string };

// Texto da hora selecionada: "10h – 11h", "17 veículos no pátio · 15% das vagas" e "3 entradas nessa hora". Em média (semana e
// mês) ou com horas agrupadas, o número é uma média e o texto avisa.
export function detalheDoGrupo(grupo: GrupoHora, { media, capacidade }: { media: boolean; capacidade: number }): DetalheDaHora {
  const horas = grupo.horaFim - grupo.hora;
  const emMedia = media || horas > 1;
  const ocupacao = capacidade > 0 ? ` · ${percentual((grupo.veiculos / capacidade) * 100)} das vagas` : "";
  return {
    titulo: `${grupo.hora}h – ${grupo.horaFim}h`,
    veiculos: `${plural(grupo.veiculos, "veículo", "veículos")} no pátio${emMedia ? " em média" : ""}${ocupacao}`,
    entradas: `${plural(grupo.entradas, "entrada", "entradas")}${media ? " em média" : ""} ${horas > 1 ? `nessas ${horas} horas` : "nessa hora"}`,
  };
}
