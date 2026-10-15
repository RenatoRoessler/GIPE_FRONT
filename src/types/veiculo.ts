// "Todas" (99) existe só na tabela de preço e não é categoria de veículo.
export const CATEGORIA_VEICULO = {
  Moto: 1,
  CarroPequeno: 2,
  CarroMedio: 3,
  SuvPickUp: 4,
  Caminhonete: 5,
  Caminhao: 6,
  CarroGrande: 7,
} as const;

export type CategoriaVeiculo = (typeof CATEGORIA_VEICULO)[keyof typeof CATEGORIA_VEICULO];

export const CATEGORIA_VEICULO_OPTIONS: { value: CategoriaVeiculo; label: string }[] = [
  { value: CATEGORIA_VEICULO.Moto, label: "Moto" },
  { value: CATEGORIA_VEICULO.CarroPequeno, label: "Carro pequeno" },
  { value: CATEGORIA_VEICULO.CarroMedio, label: "Carro médio" },
  { value: CATEGORIA_VEICULO.SuvPickUp, label: "SUV/Pick-up" },
  { value: CATEGORIA_VEICULO.Caminhonete, label: "Caminhonete" },
  { value: CATEGORIA_VEICULO.Caminhao, label: "Caminhão" },
  { value: CATEGORIA_VEICULO.CarroGrande, label: "Carro grande" },
];

export type PlacaConsulta = {
  placa: string;
  encontrado: boolean;
  origem: string | null;
  modelo: string | null;
  cor: string | null;
  categoria: number | null;
};

export type ModeloVeiculo = {
  modeloId: number;
  nome: string;
  categoria: number;
};

export type EntradaPayload = {
  placa: string;
  categoria: number;
  mensalista: boolean;
  modelo: string;
  cor: string;
};

export type EntradaRegistrada = {
  patioId: number;
  placa: string;
  categoria: number;
  codigoTicket: number;
  sequencial: number;
  mensalista: boolean;
  modelo: string | null;
  cor: string | null;
  dataHoraEntrada: string;
  rotatividadeId: number | null;
  rotatividadeDescricao: string | null;
  usuarioIdEntrada: number;
  usuarioEntrada: string;
};
