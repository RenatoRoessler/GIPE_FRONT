// Status de um serviço no veículo do pátio (patio_servico.status).
export const STATUS_SERVICO = { Aguardando: 1, EmExecucao: 2, Pronto: 3, Cancelado: 4 } as const;
export type StatusServico = (typeof STATUS_SERVICO)[keyof typeof STATUS_SERVICO];

// 1 a 6 são categorias de veículo; 99 vale para as categorias que não têm preço próprio.
export const CATEGORIA_TODAS = 99;

// Categorias de veículo que aceitam preço próprio, na ordem do formulário.
export const CATEGORIAS_SERVICO = [1, 2, 3, 4, 5, 6] as const;

export const CATEGORIA_ROTULO: Record<number, string> = {
  1: "Moto",
  2: "Carro pequeno",
  3: "Carro médio",
  4: "Caminhonete",
  5: "Caminhão",
  6: "Carro grande",
  [CATEGORIA_TODAS]: "Todas as categorias",
};

export interface PrecoServico {
  categoria: number;
  descricao: string;
  valorCentavos: number;
}

export interface Servico {
  id: number;
  nome: string;
  descricao: string | null;
  duracaoMinutos: number | null;
  // Nulo: sem tempo permitido (o back grava 0 como nulo).
  tempoPermitidoMinutos: number | null;
  ativo: boolean;
  precos: PrecoServico[];
}

// Corpo do cadastro e da edição. O valor vai em reais, como o back espera.
export interface ServicoPayload {
  nome: string;
  descricao: string | null;
  duracaoMinutos: number | null;
  tempoPermitidoMinutos: number | null;
  precos: { categoria: number; valor: number }[];
}

export interface ServicoDoVeiculo {
  // patioServicoId
  id: number;
  servicoId: number | null;
  nome: string;
  valorCentavos: number;
  tempoPermitidoMinutos: number | null;
  status: StatusServico;
  motivoCancelamento: string | null;
}

export interface ServicosDoVeiculo {
  // Soma dos serviços não cancelados, cobrada na saída junto com a permanência.
  valorServicosCentavos: number;
  tempoPermitidoMinutos: number | null;
  // Até quando a permanência não é cobrada; nulo sem tempo permitido.
  livreAte: string | null;
  servicos: ServicoDoVeiculo[];
}

// Um serviço na fila do lavador, com os dados do veículo no pátio.
export interface ItemFila {
  patioServicoId: number;
  idPatio: number;
  nomeServico: string;
  status: StatusServico;
  placa: string;
  modelo: string | null;
  cor: string | null;
  categoria: string | null;
  prisma: string | null;
  entradaEm: string | null;
}

export function isStatusServico(valor: unknown): valor is StatusServico {
  return (Object.values(STATUS_SERVICO) as unknown[]).includes(valor);
}
