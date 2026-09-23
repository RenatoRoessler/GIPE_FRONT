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

export interface CompanyData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  telefone: string;
  tipoEmpresa: TipoEmpresa | "";
}

export interface AdminUserData {
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string;
  senha: string;
  repetirSenha: string;
}

export const EMPTY_COMPANY_DATA: CompanyData = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  endereco: "",
  telefone: "",
  tipoEmpresa: "",
};

export const EMPTY_ADMIN_USER_DATA: AdminUserData = {
  nome: "",
  sobrenome: "",
  email: "",
  cpf: "",
  senha: "",
  repetirSenha: "",
};
