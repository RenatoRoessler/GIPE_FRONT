import { formatCPF, isValidCPF } from "@/lib/cpf";
import { TIPO_PESSOA, type TipoPessoa } from "@/types/mensalista";

const CNPJ_LENGTH = 14;
const CNPJ_BASE_LENGTH = 12;
const WEIGHTS_FIRST = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const WEIGHTS_SECOND = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

// Sem máscara e em maiúsculas (o CNPJ alfanumérico aceita letras).
export function normalizeDocumento(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

// As 12 primeiras posições do CNPJ aceitam letras e números; as 2 últimas (dígitos verificadores) só números.
function normalizeCnpj(value: string): string {
  const clean = normalizeDocumento(value);
  const base = clean.slice(0, CNPJ_BASE_LENGTH);
  const check = clean.slice(CNPJ_BASE_LENGTH).replace(/\D/g, "").slice(0, CNPJ_LENGTH - CNPJ_BASE_LENGTH);
  return base + check;
}

export function formatCnpjAlfanumerico(value: string): string {
  const chars = normalizeCnpj(value);
  const parts = [chars.slice(0, 2), chars.slice(2, 5), chars.slice(5, 8), chars.slice(8, 12), chars.slice(12, 14)];
  let result = parts[0];
  if (parts[1]) result += `.${parts[1]}`;
  if (parts[2]) result += `.${parts[2]}`;
  if (parts[3]) result += `/${parts[3]}`;
  if (parts[4]) result += `-${parts[4]}`;
  return result;
}

export function formatDocumento(value: string, tipoPessoa: TipoPessoa): string {
  return tipoPessoa === TIPO_PESSOA.Fisica ? formatCPF(value) : formatCnpjAlfanumerico(value);
}

// Para campos em que a pessoa não escolhe o tipo: até 11 dígitos (só números) usa a máscara de CPF; mais que isso,
// ou com letras, a de CNPJ.
export function formatDocumentoAuto(value: string): string {
  const clean = normalizeDocumento(value);
  return clean.length <= 11 && /^\d*$/.test(clean) ? formatCPF(clean) : formatCnpjAlfanumerico(clean);
}

// Valor de cada caractere = código ASCII − 48 (0–9 e A–Z), conforme o CNPJ alfanumérico.
function charValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

function checkDigit(chars: string, weights: number[]): number {
  const sum = weights.reduce((total, weight, index) => total + charValue(chars[index]) * weight, 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpjAlfanumerico(value: string): boolean {
  const chars = normalizeDocumento(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars)) {
    return false;
  }
  if (/^(.)\1+$/.test(chars)) {
    return false;
  }
  const first = checkDigit(chars, WEIGHTS_FIRST);
  const second = checkDigit(chars.slice(0, 12) + first, WEIGHTS_SECOND);
  return chars.endsWith(`${first}${second}`);
}

// Sem saber o tipo de pessoa: 11 dígitos valem como CPF; 14 caracteres, como CNPJ (inclusive alfanumérico).
export function isValidDocumentoAuto(value: string): boolean {
  const clean = normalizeDocumento(value);
  if (/^\d{11}$/.test(clean)) {
    return isValidCPF(clean);
  }
  return clean.length === CNPJ_LENGTH && isValidCnpjAlfanumerico(clean);
}

export function isValidDocumento(value: string, tipoPessoa: TipoPessoa): boolean {
  return tipoPessoa === TIPO_PESSOA.Fisica ? isValidCPF(value) : isValidCnpjAlfanumerico(value);
}
