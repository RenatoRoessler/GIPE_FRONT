export enum TipoEmpresa {
  Estacionamento = 1,
  LavaRapido = 2,
  Valet = 3,
  EstacionamentoLavaRapido = 4,
}

export const TIPO_EMPRESA_LABEL: Record<TipoEmpresa, string> = {
  [TipoEmpresa.Estacionamento]: "Estacionamento",
  [TipoEmpresa.LavaRapido]: "Lava-rápido",
  [TipoEmpresa.Valet]: "Valet",
  [TipoEmpresa.EstacionamentoLavaRapido]: "Estacionamento + Lava-rápido",
};

// Códigos de diaDaSemana enviados ao backend, na ordem de exibição.
// [A DEFINIR] com o backend: assumido 1 = domingo ... 7 = sábado. Único lugar a ajustar.
export const DIAS_SEMANA = [
  { codigo: 1, label: "Domingo" },
  { codigo: 2, label: "Segunda-feira" },
  { codigo: 3, label: "Terça-feira" },
  { codigo: 4, label: "Quarta-feira" },
  { codigo: 5, label: "Quinta-feira" },
  { codigo: 6, label: "Sexta-feira" },
  { codigo: 7, label: "Sábado" },
] as const;

export interface CompanyData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  tipoEmpresa: TipoEmpresa | "";
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  // Strings no formulário; convertidas para número no mapper do payload.
  quantidadeVagasMoto: string;
  quantidadeVagasCarro: string;
}

export interface DayHours {
  aberto: boolean;
  aberto24Horas: boolean;
  horarioAbertura: string;
  horarioFechamento: string;
}

export interface BusinessHoursData {
  horarios: DayHours[];
}

export interface AdminUserData {
  nome: string;
  cpf: string;
  email: string;
  celular: string;
  senha: string;
  repetirSenha: string;
}

export const EMPTY_COMPANY_DATA: CompanyData = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  tipoEmpresa: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  quantidadeVagasMoto: "",
  quantidadeVagasCarro: "",
};

const WEEKDAY_HOURS: DayHours = {
  aberto: true,
  aberto24Horas: false,
  horarioAbertura: "08:00",
  horarioFechamento: "18:00",
};

const CLOSED_DAY: DayHours = {
  aberto: false,
  aberto24Horas: false,
  horarioAbertura: "",
  horarioFechamento: "",
};

// Índice = posição em DIAS_SEMANA (domingo a sábado).
export const EMPTY_BUSINESS_HOURS_DATA: BusinessHoursData = {
  horarios: [
    CLOSED_DAY,
    WEEKDAY_HOURS,
    WEEKDAY_HOURS,
    WEEKDAY_HOURS,
    WEEKDAY_HOURS,
    WEEKDAY_HOURS,
    CLOSED_DAY,
  ],
};

export const EMPTY_ADMIN_USER_DATA: AdminUserData = {
  nome: "",
  cpf: "",
  email: "",
  celular: "",
  senha: "",
  repetirSenha: "",
};
