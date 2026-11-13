import { STATUS_SERVICO, type ServicoDoVeiculo, type ServicosDoVeiculo } from "@/types/servico";

export interface ResumoDosServicos {
  // Serviços que contam: os cancelados ficam de fora.
  ativos: ServicoDoVeiculo[];
  // Ainda na fila ou em andamento.
  pendentes: number;
  prontos: number;
  // Vem do back (é o que a saída cobra); nunca é somado aqui.
  subtotalCentavos: number;
}

export function resumirServicos(dados: ServicosDoVeiculo | undefined): ResumoDosServicos {
  const ativos = (dados?.servicos ?? []).filter((servico) => servico.status !== STATUS_SERVICO.Cancelado);
  const prontos = ativos.filter((servico) => servico.status === STATUS_SERVICO.Pronto).length;
  return { ativos, pendentes: ativos.length - prontos, prontos, subtotalCentavos: dados?.valorServicosCentavos ?? 0 };
}

// Aviso acima das ações de saída. Só informa: a saída nunca fica bloqueada por serviço pendente.
export function avisoDePendentes(pendentes: number): string | null {
  if (pendentes <= 0) return null;
  return pendentes === 1 ? "1 serviço ainda não está pronto." : `${pendentes} serviços ainda não estão prontos.`;
}

export interface ValorDividido {
  estadiaCentavos: number;
  servicosCentavos: number;
  totalCentavos: number;
}

// Separa o valor até agora em estadia e serviços. [A CONFIRMAR com o back] Hoje se assume que `valorAtual` (em reais)
// já inclui os serviços; se o back confirmar que não inclui, este é o único ponto a mudar: o total passa a ser
// `valorAtual + serviços` e a estadia é o próprio `valorAtual`.
const VALOR_ATUAL_INCLUI_SERVICOS = true;

export function dividirValor(valorAtualReais: number, servicosCentavos: number): ValorDividido {
  const valorAtualCentavos = Math.round(valorAtualReais * 100);
  if (VALOR_ATUAL_INCLUI_SERVICOS) {
    return { estadiaCentavos: Math.max(0, valorAtualCentavos - servicosCentavos), servicosCentavos, totalCentavos: valorAtualCentavos };
  }
  return { estadiaCentavos: valorAtualCentavos, servicosCentavos, totalCentavos: valorAtualCentavos + servicosCentavos };
}
