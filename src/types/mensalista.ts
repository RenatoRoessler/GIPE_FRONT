import type { FormaPagamentoId } from "./caixa";
import type { TipoCategoria } from "./preco";

export const TIPO_PESSOA = { Fisica: 1, Juridica: 2 } as const;
export type TipoPessoa = (typeof TIPO_PESSOA)[keyof typeof TIPO_PESSOA];

// Mesmo ECategoria do back (inclui 99 = todas as categorias).
export type CategoriaMensalidade = TipoCategoria;

// Pessoa autorizada a usar o veículo (só pessoa jurídica). CPF só com dígitos na resposta.
export type Condutor = { nome: string; cpf: string };

export type MensalistaVeiculo = {
  // Normalizada, sem hífen.
  placa: string;
  modelo: string;
  // Texto livre (até 50); a tela usa CORES_VEICULO quando bate.
  cor: string;
  // Nunca 99 em veículo.
  categoria: CategoriaMensalidade;
  // Vazio para pessoa física.
  condutores: Condutor[];
};

// Texto devolvido pelo back em `situacao` do mensalista inativo que nunca pagou.
export const SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO = "Aguardando Primeiro Pagamento";

export const CONTRATO_STATUS = { Pendente: 0, Aceito: 1, Cancelado: 2 } as const;
export type ContratoStatus = (typeof CONTRATO_STATUS)[keyof typeof CONTRATO_STATUS];

// GET /Mensalista/{id}/contrato (operador): só os campos que a tela usa.
export type ContratoMensalista = {
  status: ContratoStatus;
  // [A CONFIRMAR] string ou número no back.
  versao: string;
  titulo: string;
  dataGeracao: string | null;
  tokenExpiracao: string | null;
  dataAceite: string | null;
};

// Situação derivada para a lista e a ficha (ver situacao.ts).
export type SituacaoMensalista =
  | { kind: "ativo" }
  // Desativado ou que já pagou antes.
  | { kind: "inativo" }
  // Contrato ainda sendo consultado.
  | { kind: "carregando" }
  | { kind: "aguardando-aceite"; expiraEm: string | null }
  | { kind: "link-vencido" }
  // Sem contrato (404) ou cancelado: dá para enviar um novo.
  | { kind: "sem-contrato" }
  | { kind: "aguardando-pagamento"; aceitoEm: string | null }
  // Falha ao consultar o contrato: cai no Ativo/Inativo.
  | { kind: "desconhecida" };

// Item da listagem: GET /Mensalista
export type Mensalista = {
  mensalistaId: number;
  mensalistaTipoId: number;
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  tipoPessoa: TipoPessoa;
  // [A CONFIRMAR] se chega só com dígitos ou mascarado.
  documento: string;
  nome: string;
  email: string;
  celular: string;
  diaVencimento: number;
  ativo: boolean;
  // [A CONFIRMAR] nomes exatos dos campos de auditoria devolvidos pelo back.
  cadastradoPor?: string | null;
  alteradoPor?: string | null;
  veiculos: MensalistaVeiculo[];
  situacao: string | null;
  dataProximoVencimento: string | null;
  diasAteProximoVencimento: number | null;
};

// Veículo no corpo do POST e do PUT. `condutores` só existe para pessoa jurídica (o back recusa na física).
export type MensalistaVeiculoPayload = {
  placa: string;
  modelo: string;
  cor: string;
  categoria: CategoriaMensalidade;
  condutores?: Condutor[];
};

// Corpo do POST e do PUT /Mensalista (o PUT exige todos os campos).
export type MensalistaPayload = {
  mensalistaTipoId: number;
  tipoPessoa: TipoPessoa;
  // Sem máscara.
  documento: string;
  nome: string;
  email: string;
  // Só dígitos (DDD + 9 dígitos).
  celular: string;
  diaVencimento: number;
  ativo: boolean;
  // No PUT é sempre a lista completa (substitui a atual).
  veiculos: MensalistaVeiculoPayload[];
};

// GET /Mensalista/tipo
export type MensalistaTipo = {
  mensalistaTipoId: number;
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  // [A CONFIRMAR] "HH:mm" ou "HH:mm:ss".
  horarioEntrada: string | null;
  horarioSaida: string | null;
  ativo: boolean;
  criadoPor?: string | null;
  alteradoPor?: string | null;
};

// Corpo do POST e do PUT /Mensalista/tipo
export type MensalistaTipoPayload = {
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  horarioEntrada: string | null;
  horarioSaida: string | null;
  ativo: boolean;
};

// Valores dos formulários (strings, como os campos de texto).
export type CondutorFormValues = {
  // Chave estável só do cliente; não vai para a API.
  uid: string;
  nome: string;
  // Mascarado na tela.
  cpf: string;
};

export type VeiculoFormValues = {
  // Chave estável só do cliente; não vai para a API.
  uid: string;
  placa: string;
  modelo: string;
  cor: string;
  // "" ou o número da categoria.
  categoria: string;
  condutores: CondutorFormValues[];
};

export type MensalistaFormValues = {
  mensalistaTipoId: string;
  // "1" | "2"
  tipoPessoa: string;
  // Mascarado na tela.
  documento: string;
  nome: string;
  email: string;
  // Mascarado na tela.
  celular: string;
  diaVencimento: string;
  ativo: boolean;
  veiculos: VeiculoFormValues[];
};

export type TipoFormValues = {
  tipoMensal: string;
  categoria: string;
  // Texto monetário ("280,00").
  valorMensalidade: string;
  // "" ou "HH:mm".
  horarioEntrada: string;
  horarioSaida: string;
  ativo: boolean;
};

// EOrigemPagamento do back. Esta tela só registra pelo painel administrativo.
export const ORIGEM_PAGAMENTO = { Patio: 1, PainelAdministrativo: 2, WebHook: 3, Site: 4 } as const;

// Corpo do POST /Mensalista/pagamento. A empresa é a do token (o back a identifica); `usuarioId` vem da sessão, nunca de um campo.
export type PagamentoMensalistaPayload = {
  mensalistaId: number;
  // Maior que zero, até 2 casas.
  valorPago: number;
  formaPagamento: FormaPagamentoId;
  origemPagamento: number;
  usuarioId: number;
};

// Cobrança na resposta do pagamento. [A CONFIRMAR] os nomes exatos dos campos; o mapper é tolerante.
export type CobrancaMensalista = {
  cobrancaId: number | null;
  valor: number;
  vencimento: string | null;
  dataPagamento: string | null;
  formaPagamento: FormaPagamentoId | null;
  status: number | null;
};

export type PagamentoMensalistaResultado = {
  paga: CobrancaMensalista;
  // null quando o back não devolve a próxima cobrança.
  proxima: CobrancaMensalista | null;
};

export type PagamentoFormValues = { valorPago: string; formaPagamento: string };

// Grupos da agenda: os quatro primeiros aparecem sempre; "em-dia" e "inativos" só aparecem numa busca.
export type AgendaGrupoId = "atrasados" | "hoje" | "semana" | "sem-pagamento" | "em-dia" | "inativos";

// Um mensalista na agenda, já com o grupo e a situação derivada.
export type AgendaItemData = {
  mensalista: Mensalista;
  grupo: AgendaGrupoId;
  situacao: SituacaoMensalista;
  // Próximo vencimento como dia local (sem hora); null quando o back não informa.
  vence: Date | null;
  // Maior que zero só em "atrasados".
  diasAtraso: number;
};

export type AgendaGrupoData = { id: AgendaGrupoId; titulo: string; itens: AgendaItemData[] };

export type AgendaResumoData = {
  // Hoje + esta semana; os atrasados têm contagem própria.
  quantidade: number;
  total: number;
  ate: Date;
};

export type Agenda = {
  grupos: AgendaGrupoData[];
  // Quem não precisa de ação agora (em dia ou desativado): fora dos grupos, mas achado pela busca.
  ocultos: AgendaItemData[];
  // Ativos com vencimento depois do fim da semana.
  emDia: number;
  resumo: AgendaResumoData;
};
