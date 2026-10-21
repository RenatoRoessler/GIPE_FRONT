import { formaPagamentoLabel } from "@/components/caixa/format";
import { ApiError } from "@/lib/api/errors";
import { formatBRL, parseMoney } from "@/lib/money";
import { pagamentoSchema } from "@/lib/schemas/pagamento";
import { SessaoSemIdsError } from "@/lib/session";
import type { Mensalista, SituacaoMensalista } from "@/types/mensalista";

export type EstadoPagamento =
  | { pode: true; primeiroPagamento: boolean }
  | { pode: false; motivo: "contrato-nao-aceito" | "carregando" };

// Só decide a oferta da ação na tela; quem recusa de verdade é a API.
export function podeRegistrarPagamento(situacao: SituacaoMensalista): EstadoPagamento {
  switch (situacao.kind) {
    case "ativo":
    case "inativo":
      return { pode: true, primeiroPagamento: false };
    case "aguardando-pagamento":
    // Falha ao consultar o contrato: a API decide e o erro é tratado no modal.
    case "desconhecida":
      return { pode: true, primeiroPagamento: true };
    case "aguardando-aceite":
    case "link-vencido":
    case "sem-contrato":
      return { pode: false, motivo: "contrato-nao-aceito" };
    case "carregando":
      return { pode: false, motivo: "carregando" };
  }
}

export function rotuloAtivacao(primeiroPagamento: boolean): string {
  return primeiroPagamento
    ? "Ao confirmar: a cobrança vira paga, o cadastro será ativado e a próxima mensalidade é gerada."
    : "Ao confirmar: a cobrança vira paga e a próxima mensalidade é gerada.";
}

export function rotuloConfirmar(valorPago: string, formaPagamento: string): string {
  if (!pagamentoSchema.shape.valorPago.safeParse(valorPago).success) {
    return "Confirmar pagamento";
  }
  const forma = formaPagamento ? ` em ${formaPagamentoLabel(Number(formaPagamento))}` : "";
  return `Confirmar ${formatBRL(parseMoney(valorPago))}${forma}`;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function parseDia(value: string | null): { ano: number; mes: number; dia: number } | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? { ano: Number(match[1]), mes: Number(match[2]), dia: Number(match[3]) } : null;
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

function dd(value: number): string {
  return String(value).padStart(2, "0");
}

// A frase só existe quando o vencimento caiu no dia 1 porque o mês anterior não tem o dia do cadastro
// (ex.: dia 31 e novembro). Em qualquer outra diferença, a tela só mostra a data que a API devolveu.
export function explicarVencimento(diaCadastro: number, vencimento: string | null): string | null {
  const data = parseDia(vencimento);
  if (!data || data.dia === diaCadastro || data.dia !== 1) {
    return null;
  }
  const mesAnterior = data.mes === 1 ? 12 : data.mes - 1;
  const anoAnterior = data.mes === 1 ? data.ano - 1 : data.ano;
  if (diaCadastro <= diasNoMes(anoAnterior, mesAnterior)) {
    return null;
  }
  return `Dia ${diaCadastro} do cadastro; ${MESES[mesAnterior - 1]} não tem dia ${diaCadastro}, então vence em ${dd(data.dia)}/${dd(data.mes)}.`;
}

export type PagamentoErroKind = "contrato-nao-aceito" | "sem-cobranca" | "sessao" | "sessao-sem-ids" | "rede" | "generico";

export const MENSAGENS_ERRO_PAGAMENTO: Record<Exclude<PagamentoErroKind, "generico">, string> = {
  "contrato-nao-aceito":
    "O primeiro pagamento só é liberado depois do aceite do contrato. Reenvie o contrato ao mensalista e tente de novo depois.",
  "sem-cobranca": "Este mensalista não tem cobrança pendente para receber.",
  sessao: "Não foi possível registrar o pagamento com este usuário. Entre novamente e tente de novo.",
  "sessao-sem-ids":
    "Sua sessão não traz o código do usuário que o pagamento exige. Nada foi enviado. Entrar de novo não resolve: avise o suporte.",
  rede: "Não conseguimos confirmar se o pagamento foi registrado. Confira a situação do mensalista antes de tentar de novo.",
};

// [A CONFIRMAR] Os textos reais do back; ajustar aqui quando a validação contra a API registrá-los.
const CONTRATO_NAO_ACEITO = /contrato|aceit/i;
const SEM_COBRANCA = /pendente|cobran[cç]a/i;

export function classificarErroPagamento(error: unknown): { kind: PagamentoErroKind; message: string } {
  if (!(error instanceof ApiError)) {
    return { kind: "generico", message: "Não foi possível registrar o pagamento. Tente novamente." };
  }
  if (error instanceof SessaoSemIdsError) {
    return { kind: "sessao-sem-ids", message: MENSAGENS_ERRO_PAGAMENTO["sessao-sem-ids"] };
  }
  if (error.kind === "network" || error.kind === "timeout") {
    return { kind: "rede", message: MENSAGENS_ERRO_PAGAMENTO.rede };
  }
  if (error.kind === "unauthorized") {
    return { kind: "sessao", message: MENSAGENS_ERRO_PAGAMENTO.sessao };
  }
  if (error.status === 400 || error.status === 404) {
    if (CONTRATO_NAO_ACEITO.test(error.message)) {
      return { kind: "contrato-nao-aceito", message: MENSAGENS_ERRO_PAGAMENTO["contrato-nao-aceito"] };
    }
    if (SEM_COBRANCA.test(error.message)) {
      return { kind: "sem-cobranca", message: MENSAGENS_ERRO_PAGAMENTO["sem-cobranca"] };
    }
  }
  return { kind: "generico", message: error.message };
}

// Data de cobrança é um dia, sem hora: formatar pelas partes evita o deslocamento de fuso de `new Date("2026-11-05")`.
export function formatDiaCobranca(iso: string | null): string {
  const data = parseDia(iso);
  return data ? `${dd(data.dia)}/${dd(data.mes)}/${String(data.ano).slice(-2)}` : "—";
}

// Depois de uma falha de rede, o pagamento foi gravado se a situação do mensalista mudou na listagem.
export function pagamentoJaRegistrado(
  antes: Pick<Mensalista, "ativo" | "situacao" | "dataProximoVencimento">,
  depois: Pick<Mensalista, "ativo" | "situacao" | "dataProximoVencimento">,
): boolean {
  return (
    antes.ativo !== depois.ativo ||
    antes.situacao !== depois.situacao ||
    antes.dataProximoVencimento !== depois.dataProximoVencimento
  );
}
