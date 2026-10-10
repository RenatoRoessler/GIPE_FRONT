import { DIAS_SEMANA } from "./adesao";

export const TIPO_REGRA = {
  Padrao: 1,
  Convenio: 2,
  Promocional: 3,
  Evento: 4,
} as const;

export const TIPO_CATEGORIA = {
  Moto: 1,
  CarroPequeno: 2,
  CarroMedio: 3,
  SuvPickUp: 4,
  Caminhonete: 5,
  Caminhao: 6,
  Todas: 99,
} as const;

export type TipoRegra = (typeof TIPO_REGRA)[keyof typeof TIPO_REGRA];
export type TipoCategoria = (typeof TIPO_CATEGORIA)[keyof typeof TIPO_CATEGORIA];

export const TIPO_REGRA_OPTIONS: { value: TipoRegra; label: string }[] = [
  { value: TIPO_REGRA.Padrao, label: "Padrão" },
  { value: TIPO_REGRA.Convenio, label: "Convênio" },
  { value: TIPO_REGRA.Promocional, label: "Promocional" },
  { value: TIPO_REGRA.Evento, label: "Evento" },
];

export const TIPO_CATEGORIA_OPTIONS: { value: TipoCategoria; label: string }[] = [
  { value: TIPO_CATEGORIA.Moto, label: "Moto" },
  { value: TIPO_CATEGORIA.CarroPequeno, label: "Carro pequeno" },
  { value: TIPO_CATEGORIA.CarroMedio, label: "Carro médio" },
  { value: TIPO_CATEGORIA.SuvPickUp, label: "SUV / Pick-up" },
  { value: TIPO_CATEGORIA.Caminhonete, label: "Caminhonete" },
  { value: TIPO_CATEGORIA.Caminhao, label: "Caminhão" },
  { value: TIPO_CATEGORIA.Todas, label: "Todas" },
];

// Períodos de diária oferecidos no cadastro; o valor enviado ao backend é em minutos.
export const PERIODO_DIARIA_OPTIONS = [
  { minutos: 360, label: "6 Horas" },
  { minutos: 720, label: "12 Horas" },
  { minutos: 1440, label: "24 Horas" },
] as const;

// Mesma convenção de código de dia da adesão (a confirmar com o backend; único lugar a ajustar).
export const DIAS_SEMANA_PRECO = DIAS_SEMANA;

export type SituacaoPreco = "vigente" | "agendada" | "encerrada" | "inativa";

export interface PrecoRegraView {
  diaSemana: number;
  horaInicio: string | null;
  horaFim: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
}

export interface PrecoFaixaView {
  minutosLimite: number;
  valor: number;
  percentualConveniada: number | null;
}

export interface PrecoView {
  rotatividadeId: number;
  empresaConveniadaId: number | null;
  descricao: string;
  // null quando o backend devolve um valor fora do enum (ex.: 0).
  tipoRegra: TipoRegra | null;
  inicioVigencia: string;
  fimVigencia: string | null;
  toleranciaEntradaMinutos: number;
  toleranciaAlteracaoFaixaMinutos: number;
  periodoDiaria: number;
  valorDiaria: number;
  valorAdicionalDiaria: number;
  ativo: boolean;
  regras: PrecoRegraView[];
  faixas: PrecoFaixaView[];
  categorias: TipoCategoria[];
}

export interface PrecoInfoValues {
  descricao: string;
  tipoRegra: string;
  // Formato de <input type="datetime-local">: "YYYY-MM-DDTHH:mm".
  inicioVigencia: string;
  fimVigencia: string;
  toleranciaEntradaMinutos: string;
  toleranciaAlteracaoFaixaMinutos: string;
  periodoDiaria: string;
  valorDiaria: string;
  valorAdicionalDiaria: string;
  ativo: boolean;
}

export interface PrecoHorarioValues {
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
}

export interface PrecoFaixaValues {
  minutosLimite: string;
  valor: string;
  percentualConveniada: string;
}

export interface PrecoHorariosValues {
  horarios: PrecoHorarioValues[];
}

export interface PrecoFaixasValues {
  faixas: PrecoFaixaValues[];
}

export interface PrecoCategoriasValues {
  categorias: TipoCategoria[];
}

export interface PrecoFormValues {
  info: PrecoInfoValues;
  horarios: PrecoHorarioValues[];
  faixas: PrecoFaixaValues[];
  categorias: TipoCategoria[];
}

export const EMPTY_PRECO_INFO: PrecoInfoValues = {
  descricao: "",
  tipoRegra: String(TIPO_REGRA.Padrao),
  inicioVigencia: "",
  fimVigencia: "",
  toleranciaEntradaMinutos: "0",
  toleranciaAlteracaoFaixaMinutos: "0",
  periodoDiaria: String(PERIODO_DIARIA_OPTIONS[1].minutos),
  valorDiaria: "",
  valorAdicionalDiaria: "",
  ativo: true,
};

export const EMPTY_PRECO_HORARIO: PrecoHorarioValues = {
  diaSemana: "2",
  horaInicio: "08:00",
  horaFim: "18:00",
  dataInicio: "",
  dataFim: "",
  ativo: true,
};

export const EMPTY_PRECO_FAIXA: PrecoFaixaValues = {
  minutosLimite: "",
  valor: "",
  percentualConveniada: "",
};

// Faixas sugeridas no cadastro; o usuário pode editar, remover ou adicionar.
export const DEFAULT_PRECO_FAIXAS: PrecoFaixaValues[] = [
  { minutosLimite: "60", valor: "15,00", percentualConveniada: "" },
  { minutosLimite: "120", valor: "25,00", percentualConveniada: "" },
  { minutosLimite: "180", valor: "30,00", percentualConveniada: "" },
  { minutosLimite: "240", valor: "35,00", percentualConveniada: "" },
  { minutosLimite: "300", valor: "40,00", percentualConveniada: "" },
  { minutosLimite: "360", valor: "45,00", percentualConveniada: "" },
  { minutosLimite: "720", valor: "50,00", percentualConveniada: "" },
];

export const EMPTY_PRECO_FORM_VALUES: PrecoFormValues = {
  info: EMPTY_PRECO_INFO,
  horarios: [],
  faixas: DEFAULT_PRECO_FAIXAS,
  categorias: [],
};
