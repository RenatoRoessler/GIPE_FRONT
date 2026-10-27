// Um veículo no pátio (GET /Patio).
export type PatioVeiculo = {
  patioId: number;
  // Normalizada, sem hífen.
  placa: string;
  // CATEGORIA_VEICULO; valores novos do back não podem quebrar a tela.
  categoria: number;
  modelo: string | null;
  // Texto livre.
  cor: string | null;
  codigoTicket: number | null;
  sequencial: number;
  mensalista: boolean;
  // Sem fuso; ler com parseApiDate.
  dataHoraEntrada: string;
  // Calculado pelo servidor no instante da consulta.
  minutosPermanencia: number;
  // Texto pronto do servidor (ex.: "4d 1h 7min"); a tela não o reformata.
  permanencia: string;
  rotatividadeDescricao: string | null;
  usuarioEntrada: string | null;
  // Abre o comprovante; nunca é exibido.
  token: string | null;
  // Onde a chave está no quadro (ex.: "A2" ou "Recepção · A2"); ausente ou null quando nenhuma posição foi escolhida.
  posicaoChave?: string | null;
  // A mesma posição em partes, para achar o gancho na grade do quadro; null quando o formato não é reconhecido.
  chaveRef?: ChaveRef | null;
};

// Posição da chave no quadro. `quadro` só existe quando o back informa o nome.
export type ChaveRef = {
  quadro: string | null;
  linha: string;
  coluna: number;
  // Ids do back, quando ele os informa: dispensam achar o gancho pelo nome do quadro e pela posição.
  patioQuadroId?: number;
  patioQuadroChaveId?: number;
};

export type PatioFiltroTipo = "todos" | "mensalistas" | "avulsos";

export type PatioFiltros = {
  busca: string;
  tipo: PatioFiltroTipo;
  categoria: number | "todas";
};

export type PatioResumo = { total: number; mostrados: number };

export type PatioContagem = { rotulo: string; valor: number };

// Números do pátio inteiro (sem filtros) para os indicadores da home e do painel de gráficos.
export type PatioEstatisticas = {
  total: number;
  mensalistas: number;
  avulsos: number;
  // Inteiro de 0 a 100; 0 quando o pátio está vazio.
  percentualMensalistas: number;
  mediaMinutos: number;
  // Veículos há 3 dias ou mais no pátio.
  permanenciaLonga: number;
  maisAntigo: PatioVeiculo | null;
  porCategoria: (PatioContagem & { categoria: number })[];
  porPermanencia: (PatioContagem & { longa: boolean })[];
  porOperador: PatioContagem[];
};

export type PatioVagas = { moto: number; carro: number };

export type PatioOcupacaoGrupo = { ocupadas: number; vagas: number };

export type PatioChegadaHora = { hora: number; valor: number };

// Chegadas de hoje de quem ainda está no pátio, uma coluna por hora (de `horas[0]` até a última).
export type PatioChegadas = {
  horas: PatioChegadaHora[];
  total: number;
  pico: PatioChegadaHora | null;
};

export type PatioOcupacao = {
  // Arredondado; passa de 100 quando há mais veículos que vagas.
  percentual: number;
  motos: PatioOcupacaoGrupo;
  carros: PatioOcupacaoGrupo;
};
