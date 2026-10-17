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

// Cores de pintura: dados do veículo, iguais nos dois temas (não são tokens de tema).
// [A CONFIRMAR] com o back o formato aceito em `cor` (aqui, o nome em caixa alta e sem acento).
export const CORES_VEICULO = [
  { value: "BRANCO", label: "Branco", color: "#FFFFFF" },
  { value: "PRETO", label: "Preto", color: "#1A1A1A" },
  { value: "PRATA", label: "Prata", color: "#C3C7CC" },
  { value: "CINZA", label: "Cinza", color: "#6E747C" },
  { value: "VERMELHO", label: "Vermelho", color: "#B3261E" },
  { value: "AZUL", label: "Azul", color: "#1F4FD6" },
  { value: "VERDE", label: "Verde", color: "#2E7D4F" },
  { value: "BEGE", label: "Bege", color: "#D8C7A3" },
] as const;

export type CorVeiculo = (typeof CORES_VEICULO)[number]["value"];

export const COR_PADRAO: CorVeiculo = "PRATA";

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// A cor do cadastro de placas é texto livre: só vale se casar com uma das cores do enum.
export function matchCor(texto: string | null | undefined): CorVeiculo | null {
  if (!texto) {
    return null;
  }
  const normalizado = semAcento(texto).trim().toUpperCase();
  return CORES_VEICULO.find((cor) => cor.value === normalizado)?.value ?? null;
}

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
  cor: CorVeiculo;
};

export type EntradaRegistrada = {
  patioId: number;
  placa: string;
  categoria: number;
  codigoTicket: number | string;
  sequencial: number;
  mensalista: boolean;
  modelo: string | null;
  cor: string | null;
  dataHoraEntrada: string;
  rotatividadeId: number | null;
  rotatividadeDescricao: string | null;
  usuarioIdEntrada: number;
  usuarioEntrada: string;
  // Identifica a entrada na página pública do comprovante.
  token: string;
};

// GET /Patio/comprovante/cliente?token=...
export type ComprovanteCliente = {
  cnpj: string;
  razaoSocial: string;
  endereco: string | null;
  telefone: string | null;
  placa: string;
  modelo: string | null;
  // Texto livre: entradas antigas não seguem o enum de cores.
  cor: string | null;
  categoriaId: number;
  categoriaDescricao: string;
  // ISO sem fuso; a consulta vem com 7 casas decimais.
  dataHoraEntrada: string;
  dataHoraConsulta: string;
  minutosPermanencia: number;
  permanencia: string;
  sequencial: number;
  token: string;
  valorAtual: number;
};
