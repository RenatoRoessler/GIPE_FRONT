// Valores numéricos da API de conferência de pátio (/conferencia-patio), nomeados para a tela nunca depender de um número solto.
export const METODO_CONFERENCIA = { Camera: 1, Lista: 2 } as const;
export const SITUACAO_CONFERENCIA = { Aberta: 1, Finalizada: 2, Incompleta: 3 } as const;
export const SITUACAO_ITEM = { Pendente: 1, Conferido: 2, NaoEncontrado: 3, Baixado: 4, Saiu: 5 } as const;
// As leituras enviam só Camera ou Manual; Entrada aparece em itens criados pela entrada de uma placa sem ticket.
export const ORIGEM_ITEM = { Camera: 1, Manual: 2, Entrada: 3 } as const;
export const RESULTADO_LEITURA = { Conferido: 1, JaConferido: 2, SemEntrada: 3 } as const;
export const SITUACAO_SEM_ENTRADA = { Pendente: 1, EntradaRegistrada: 2, Descartada: 3 } as const;
export const MOTIVO_SAIDA = { SaiuSemBaixa: 1, TicketDuplicado: 2, EntradaPorEngano: 3, Outro: 4 } as const;
export const TIPO_AJUSTE = { Saida: 1, Entrada: 2 } as const;

export type MotivoSaida = (typeof MOTIVO_SAIDA)[keyof typeof MOTIVO_SAIDA];
export type MetodoConferencia = (typeof METODO_CONFERENCIA)[keyof typeof METODO_CONFERENCIA];
export type OrigemLeitura = typeof ORIGEM_ITEM.Camera | typeof ORIGEM_ITEM.Manual;
export type SituacaoMarcacao = typeof SITUACAO_ITEM.Pendente | typeof SITUACAO_ITEM.Conferido | typeof SITUACAO_ITEM.NaoEncontrado;

export type TipoCliente = "avulso" | "mensal" | "conveniado";

// GET /resumo
export type ConferenciaEncerrada = {
  patioConferenciaId: number;
  caixaId: number;
  // Finalizada ou Incompleta (encerrada no fechamento do caixa).
  situacao: number;
  dataFim: string;
  usuarioIdFim: number | null;
  usuarioFim: string | null;
  totalVeiculos: number;
  totalConferidos: number;
};

// [A CONFIRMAR] Visto sempre `null` no resumo; os nomes seguem o texto do swagger.
export type ConferenciaEmAndamento = {
  patioConferenciaId: number;
  caixaId: number;
  dataInicio: string;
  usuarioIdInicio: number | null;
  usuarioInicio: string | null;
  total: number;
  conferidos: number;
};

export type ConferenciaResumo = {
  totalVeiculos: number;
  avulsos: number;
  mensais: number;
  conveniados: number;
  // `null` sem caixa aberto: não dá para iniciar a conferência.
  caixaIdAberto: number | null;
  ultimaConferencia: ConferenciaEncerrada | null;
  conferenciaAberta: ConferenciaEmAndamento | null;
};

export type ChaveItem = { quadroChaveId: number; posicao: string; patioQuadroId: number; quadro: string };

export type ItemConferencia = {
  patioConferenciaItemId: number;
  patioId: number;
  // Normalizada (maiúsculas, sem hífen).
  placa: string;
  modelo: string | null;
  cor: string | null;
  categoria: number;
  // Sem fuso; ler com parseApiDate.
  dataEntrada: string;
  mensalista: boolean;
  conveniado: boolean;
  situacao: number;
  origem: number | null;
  dataConferido: string | null;
  usuarioIdConferido: number | null;
  usuarioConferido: string | null;
  chave: ChaveItem | null;
};

export type SemEntrada = {
  patioConferenciaSemEntradaId: number;
  placa: string;
  dataLeitura: string;
  situacao: number;
  patioId: number | null;
};

// [A CONFIRMAR] Sempre vazio nos testes (a saída e a entrada pela conferência não foram exercitadas): só `tipo`, `motivo` e `descricao` vêm do swagger.
export type AjusteConferencia = {
  tipo: number;
  placa: string | null;
  motivo: number | null;
  descricao: string;
};

// GET /aberta e GET /{id}. O `totais` do servidor não é guardado: os totais saem das regras puras da tela.
export type Conferencia = {
  patioConferenciaId: number;
  caixaId: number;
  metodo: number;
  situacao: number;
  dataInicio: string;
  usuarioIdInicio: number | null;
  usuarioInicio: string | null;
  dataFim: string | null;
  usuarioIdFim: number | null;
  usuarioFim: string | null;
  observacao: string | null;
  itens: ItemConferencia[];
  semEntrada: SemEntrada[];
  ajustes: AjusteConferencia[];
};

// POST /{id}/leituras: `item` vem em Conferido e JaConferido; `semEntrada`, em SemEntrada.
export type ResultadoLeitura = {
  resultado: number;
  placa: string;
  item: ItemConferencia | null;
  semEntrada: SemEntrada | null;
};

export type SaidaConferenciaPayload = {
  valor: number;
  formaPagamento: number;
  motivo: MotivoSaida;
  // Obrigatória no motivo Outro, até 300 caracteres.
  descricao?: string;
};

export type EntradaConferenciaPayload = {
  categoria: number;
  // Até 80 caracteres.
  modelo: string;
  // Até 50 caracteres.
  cor: string;
  codigoTicket?: number;
  mensalista: boolean;
};

export type ConferenciaEtapa = "inicio" | "conferindo" | "divergencias" | "resumo";
export type FiltroLista = "faltam" | "conferidos";
