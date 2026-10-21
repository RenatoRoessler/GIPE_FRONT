import { parseApiDate } from "@/lib/date";
import {
  CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  type ContratoMensalista,
  type Mensalista,
  type SituacaoMensalista,
} from "@/types/mensalista";

// O que a derivação precisa saber da consulta do contrato (compatível com o resultado do useQuery).
export type ContratoConsulta = {
  isPending: boolean;
  isError: boolean;
  // null = o mensalista não tem contrato (404).
  data: ContratoMensalista | null | undefined;
};

// Só o mensalista inativo que nunca pagou depende do contrato para saber em que etapa está.
export function precisaDoContrato(mensalista: Pick<Mensalista, "ativo" | "situacao">): boolean {
  return !mensalista.ativo && mensalista.situacao === SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO;
}

export function derivarSituacao(
  mensalista: Pick<Mensalista, "ativo" | "situacao">,
  contrato: ContratoConsulta | undefined,
  agora: Date,
): SituacaoMensalista {
  if (mensalista.ativo) {
    return { kind: "ativo" };
  }
  if (!precisaDoContrato(mensalista)) {
    return { kind: "inativo" };
  }
  if (!contrato || contrato.isError) {
    return { kind: "desconhecida" };
  }
  if (contrato.isPending) {
    return { kind: "carregando" };
  }
  const dados = contrato.data;
  if (!dados || dados.status === CONTRATO_STATUS.Cancelado) {
    return { kind: "sem-contrato" };
  }
  if (dados.status === CONTRATO_STATUS.Aceito) {
    return { kind: "aguardando-pagamento", aceitoEm: dados.dataAceite };
  }

  // Pendente: o link vale até `tokenExpiracao` (no instante exato já venceu).
  const expiracao = parseApiDate(dados.tokenExpiracao);
  if (expiracao && expiracao.getTime() <= agora.getTime()) {
    return { kind: "link-vencido" };
  }
  return { kind: "aguardando-aceite", expiraEm: dados.tokenExpiracao };
}
