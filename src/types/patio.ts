// Um veículo no pátio (GET /Patio). `quadroChaves` não é lido nesta versão.
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
};

export type PatioFiltroTipo = "todos" | "mensalistas" | "avulsos";

export type PatioFiltros = {
  busca: string;
  tipo: PatioFiltroTipo;
  categoria: number | "todas";
};

export type PatioResumo = { total: number; mostrados: number };
