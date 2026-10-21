import type { ContratoStatus } from "./mensalista";

// GET /Mensalista/contrato/cliente (público): o que o mensalista vê pelo link do e-mail.
export type ContratoCliente = {
  razaoSocial: string;
  nomeMensalista: string;
  // [A CONFIRMAR] string ou número no back.
  versao: string;
  titulo: string;
  // Texto simples: as quebras de linha são preservadas na exibição.
  conteudo: string;
  // SHA-256 em hexadecimal.
  hash: string;
  status: ContratoStatus;
  tokenExpiracao: string | null;
  dataAceite: string | null;
};

// POST /Mensalista/contrato/cliente/aceitar
export type AceiteContrato = { dataAceite: string; hash: string };

// Erros do fluxo público, já classificados (ver services/contrato.ts).
export type ContratoErroKind = "vencido" | "invalido" | "documento" | "ja-aceito" | "rate-limited";
