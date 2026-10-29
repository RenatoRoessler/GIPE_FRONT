import type { EnderecoPayload } from "@/lib/api/services/adesao.mapper";

// Item da listagem: GET /Empresa/conveniada (uma linha por convênio).
export type Conveniada = {
  empresaConvenioId: number;
  empresaConveniadaId: number;
  empresaGuid: string;
  razaoSocial: string;
  // "" quando ausente.
  nomeFantasia: string;
  // Só dígitos.
  cnpj: string;
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  // Situação do convênio.
  ativo: boolean;
  // ISO, cadastro do convênio.
  dataCriacao: string;
};

export type SituacaoFiltro = "todos" | "ativos" | "encerrados";

// Corpo do POST /Empresa/conveniada. Sem tipoEmpresa: o back grava sempre 5 (Conveniada).
export type ConveniadaPayload = {
  empresa: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    telefone: string;
    endereco: EnderecoPayload;
  };
  usuario: { nome: string; cpf: string; email: string; celular: string };
};

// Resposta do POST.
export type ConveniadaResultado = {
  empresaConveniadaId: number;
  empresaGuid: string;
  novaEmpresa: boolean;
  usuarioId: number;
  novoUsuario: boolean;
};

// Valores do formulário (strings, com máscara na tela).
export type ConveniadaFormValues = {
  cnpj: string;
  telefone: string;
  razaoSocial: string;
  nomeFantasia: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  usuarioNome: string;
  usuarioCpf: string;
  usuarioEmail: string;
  usuarioCelular: string;
};

export const EMPTY_CONVENIADA_FORM: ConveniadaFormValues = {
  cnpj: "",
  telefone: "",
  razaoSocial: "",
  nomeFantasia: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  usuarioNome: "",
  usuarioCpf: "",
  usuarioEmail: "",
  usuarioCelular: "",
};

// Conveniada como opção de escolha em outras telas (ex.: cadastro de preço).
export type ConveniadaOpcao = {
  empresaConveniadaId: number;
  // Nome fantasia ou, sem ele, razão social.
  nome: string;
};
