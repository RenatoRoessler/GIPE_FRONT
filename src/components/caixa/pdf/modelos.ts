import type { Caixa, CaixaFechado, Movimento, Turno } from "@/types/caixa";
import { rotuloTipoMovimento } from "../exportCsv";
import { describeDiferenca, formaPagamentoLabel, formatDateTime, formatMoeda } from "../format";

export type EmpresaPdf = { razaoSocial: string; cnpj?: string | null } | null;

export type Contexto = { rotulo: string; valor: string };

export type ComprovanteTurnoModelo = {
  titulo: string;
  empresa: EmpresaPdf;
  contexto: Contexto[];
  formas: { forma: string; esperado: string; informado: string; diferenca: string }[];
  total: { esperado: string; informado: string; diferenca: string };
  observacao: string | null;
  assinaturas: string[];
};

function textoDiferenca(diferenca: number | null): string {
  const info = describeDiferenca(diferenca);
  if (!info) {
    return "-";
  }
  return diferenca === 0 ? info.label : `${info.label} ${info.value}`;
}

export type ComprovanteTurnoEntrada = {
  tipo: "fechamento" | "passagem";
  // Turno encerrado: o resumo que a API devolve ao fechar o caixa (o da passagem vem da lista de turnos).
  turno: Turno;
  empresa?: EmpresaPdf;
  // Passagem: quem assume o turno.
  novoResponsavel?: string | null;
};

// Dados do comprovante de fechamento ou de passagem de turno; texto pronto para desenhar.
export function montarComprovanteTurno({ tipo, turno, empresa = null, novoResponsavel = null }: ComprovanteTurnoEntrada): ComprovanteTurnoModelo {
  const contexto: Contexto[] = [
    { rotulo: "Caixa", valor: `Nº ${turno.caixaId}` },
    { rotulo: "Responsável pelo turno", valor: turno.usuario || "-" },
    { rotulo: "Início", valor: formatDateTime(turno.dataHoraInicio) },
    { rotulo: "Fim", valor: turno.dataHoraFim ? formatDateTime(turno.dataHoraFim) : "-" },
    { rotulo: "Fundo do turno", valor: formatMoeda(turno.valorFundoCaixa) },
  ];
  if (tipo === "passagem" && novoResponsavel) {
    contexto.push({ rotulo: "Assume o turno", valor: novoResponsavel });
  }

  return {
    titulo: tipo === "fechamento" ? "Fechamento de caixa" : "Passagem de turno",
    empresa,
    contexto,
    formas: turno.formasPagamento.map((forma) => ({
      forma: forma.descricao || formaPagamentoLabel(forma.formaPagamento),
      esperado: formatMoeda(forma.valorEsperado),
      informado: forma.valorInformado === null ? "-" : formatMoeda(forma.valorInformado),
      diferenca: textoDiferenca(forma.diferenca),
    })),
    total: {
      esperado: formatMoeda(turno.saldoCaixa),
      informado: turno.saldoCaixaInformado === null ? "-" : formatMoeda(turno.saldoCaixaInformado),
      diferenca: textoDiferenca(turno.totalDiferenca),
    },
    observacao: turno.observacao,
    assinaturas: tipo === "fechamento" ? ["Responsável pelo caixa", "Conferência"] : ["Quem entrega o turno", "Quem assume o turno"],
  };
}

export type ExtratoModelo = {
  titulo: string;
  empresa: EmpresaPdf;
  contexto: Contexto[];
  colunas: string[];
  linhas: string[][];
  totais: { entradas: string; saidas: string };
  // Aviso de que a lista é parte do caixa (filtros ativos na tela).
  filtro: string | null;
};

// O extrato de um caixa fechado nem sempre tem os dados do caixa à mão (só os movimentos): o que falta sai como traço.
export type CaixaResumo = Pick<Caixa, "caixaId"> & Partial<CaixaFechado>;

export type ExtratoEntrada = {
  caixa: CaixaResumo;
  movimentos: Movimento[];
  empresa?: EmpresaPdf;
  filtro?: string | null;
};

const COLUNAS_EXTRATO = ["Data/hora", "Tipo", "Forma", "Usuário", "Motivo", "Valor"];

export function montarExtrato({ caixa, movimentos, empresa = null, filtro = null }: ExtratoEntrada): ExtratoModelo {
  const abriu = "abriu" in caixa && caixa.abriu ? caixa.abriu : null;
  const fechou = "fechou" in caixa && caixa.fechou ? caixa.fechou : null;
  const contexto: Contexto[] = [
    { rotulo: "Caixa", valor: `Nº ${caixa.caixaId}` },
    { rotulo: "Aberto em", valor: caixa.dataHoraAbertura ? formatDateTime(caixa.dataHoraAbertura) + (abriu ? ` por ${abriu}` : "") : "-" },
    { rotulo: "Fechado em", valor: caixa.dataHoraFechamento ? formatDateTime(caixa.dataHoraFechamento) + (fechou ? ` por ${fechou}` : "") : "-" },
    { rotulo: "Fundo de caixa", valor: caixa.valorFundoCaixa === undefined ? "-" : formatMoeda(caixa.valorFundoCaixa) },
  ];

  let entradas = 0;
  let saidas = 0;
  const linhas = movimentos.map((movimento) => {
    const entrada = movimento.tipo === "entrada";
    if (entrada) {
      entradas += movimento.valor;
    } else {
      saidas += movimento.valor;
    }
    return [
      formatDateTime(movimento.dataHora),
      rotuloTipoMovimento(movimento.tipo),
      movimento.formaPagamento === null ? "-" : formaPagamentoLabel(movimento.formaPagamento),
      movimento.usuario || "-",
      movimento.motivo || "-",
      `${entrada ? "+" : "-"} ${formatMoeda(movimento.valor)}`,
    ];
  });

  return {
    titulo: "Extrato do caixa",
    empresa,
    contexto,
    colunas: COLUNAS_EXTRATO,
    linhas,
    totais: { entradas: formatMoeda(Math.round(entradas * 100) / 100), saidas: formatMoeda(Math.round(saidas * 100) / 100) },
    filtro,
  };
}
