// Resposta de PUT /Convenio/carimbar: o veículo carimbado e a tabela de convênio aplicada.
export type Carimbo = {
  estacionamento: string;
  placa: string;
  modelo: string;
  // Como vem do back (ex.: "PRATA").
  cor: string;
  // Categoria do veículo (1 a 6).
  categoria: number;
  // ISO sem fuso.
  dataHoraEntrada: string;
  rotatividadeId: number;
  // Nome da tabela de convênio aplicada.
  rotatividade: string;
  // ISO sem fuso: momento do carimbo.
  dataHoraConveniada: string;
};
