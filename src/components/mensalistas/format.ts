import { getCategoriaLabel } from "@/components/precos/format";
import { formatCPF } from "@/lib/cpf";
import { formatCnpjAlfanumerico, formatDocumento, normalizeDocumento } from "@/lib/documento";
import { formatBRL } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { Mensalista, MensalistaTipo } from "@/types/mensalista";

export function formatCategoria(categoria: MensalistaTipo["categoria"]): string {
  return getCategoriaLabel(categoria);
}

export function formatValor(valor: number): string {
  return formatBRL(valor);
}

function hhmm(value: string): string {
  return value.slice(0, 5);
}

// "07:00 – 19:00"; sem horário, "—". A saída menor que a entrada (turno da noite) aparece como está.
export function formatHorario(entrada: string | null, saida: string | null): string {
  if (!entrada || !saida) {
    return "—";
  }
  return `${hhmm(entrada)} – ${hhmm(saida)}`;
}

export function formatVencimento(dia: number): string {
  return `dia ${dia}`;
}

export function formatDocumentoMensalista(mensalista: Pick<Mensalista, "documento" | "tipoPessoa">): string {
  return formatDocumento(mensalista.documento, mensalista.tipoPessoa);
}

export function formatCelular(celular: string): string {
  return formatPhone(celular);
}

// Máscara da busca por documento: só números até 11 caracteres => CPF; mais que isso (ou com letras) => CNPJ.
export function formatBusca(value: string): string {
  const clean = normalizeDocumento(value);
  return clean.length <= 11 && /^\d*$/.test(clean) ? formatCPF(clean) : formatCnpjAlfanumerico(clean);
}
