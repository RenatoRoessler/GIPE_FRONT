// Item de GET /Convenio/patio: veículo carimbado pela conveniada que ainda não saiu do estacionamento.
export type VeiculoConveniada = {
  patioConvenioId: number;
  // Id do estacionamento.
  empresaId: number;
  estacionamento: string;
  placa: string;
  modelo: string;
  // Como vem do back (ex.: "PRATA").
  cor: string;
  // Categoria do veículo (1 a 6).
  categoria: number;
  // ISO sem fuso.
  dataEntrada: string;
  // ISO sem fuso: momento do carimbo.
  dataValidacao: string;
  usuarioIdConveniada: number;
  // Quem carimbou.
  usuarioConveniada: string;
  rotatividadeId: number;
  // Nome da tabela de convênio.
  rotatividade: string;
  minutosPermanencia: number;
  // Já formatada pelo servidor ("0h 30min", "1d 5h 26min").
  permanencia: string;
};

export type EstacionamentoConveniada = {
  empresaId: number;
  nome: string;
  total: number;
};

export type ResumoPatioConveniada = {
  total: number;
  porEstacionamento: EstacionamentoConveniada[];
};
