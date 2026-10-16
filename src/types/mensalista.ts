import type { TipoCategoria } from "./preco";

export const TIPO_PESSOA = { Fisica: 1, Juridica: 2 } as const;
export type TipoPessoa = (typeof TIPO_PESSOA)[keyof typeof TIPO_PESSOA];

// Mesmo ECategoria do back (inclui 99 = todas as categorias).
export type CategoriaMensalidade = TipoCategoria;

// Item da listagem: GET /Mensalista
export type Mensalista = {
  mensalistaId: number;
  mensalistaTipoId: number;
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  tipoPessoa: TipoPessoa;
  // [A CONFIRMAR] se chega só com dígitos ou mascarado.
  documento: string;
  nome: string;
  email: string;
  celular: string;
  diaVencimento: number;
  ativo: boolean;
  // [A CONFIRMAR] nomes exatos dos campos de auditoria devolvidos pelo back.
  cadastradoPor?: string | null;
  alteradoPor?: string | null;
};

// Corpo do POST e do PUT /Mensalista (o PUT exige todos os campos).
export type MensalistaPayload = {
  mensalistaTipoId: number;
  tipoPessoa: TipoPessoa;
  // Sem máscara.
  documento: string;
  nome: string;
  email: string;
  // Só dígitos (DDD + 9 dígitos).
  celular: string;
  diaVencimento: number;
  ativo: boolean;
};

// GET /Mensalista/tipo
export type MensalistaTipo = {
  mensalistaTipoId: number;
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  // [A CONFIRMAR] "HH:mm" ou "HH:mm:ss".
  horarioEntrada: string | null;
  horarioSaida: string | null;
  ativo: boolean;
  criadoPor?: string | null;
  alteradoPor?: string | null;
};

// Corpo do POST e do PUT /Mensalista/tipo
export type MensalistaTipoPayload = {
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  horarioEntrada: string | null;
  horarioSaida: string | null;
  ativo: boolean;
};

// Valores dos formulários (strings, como os campos de texto).
export type MensalistaFormValues = {
  mensalistaTipoId: string;
  // "1" | "2"
  tipoPessoa: string;
  // Mascarado na tela.
  documento: string;
  nome: string;
  email: string;
  // Mascarado na tela.
  celular: string;
  diaVencimento: string;
  ativo: boolean;
};

export type TipoFormValues = {
  tipoMensal: string;
  categoria: string;
  // Texto monetário ("280,00").
  valorMensalidade: string;
  // "" ou "HH:mm".
  horarioEntrada: string;
  horarioSaida: string;
  ativo: boolean;
};
