import { getCategoriaLabel } from "@/components/precos/format";
import { formatDocumento } from "@/lib/documento";
import { formatBRL } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { DIAS_TIPO, type DiasTipo, type Mensalista, type MensalistaTipo } from "@/types/mensalista";

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

// "Todos os dias", "Seg a Sex" (3 ou mais dias seguidos) ou a lista ("Seg, Qua, Sáb").
export function formatDias(dias: DiasTipo): string {
  const marcados = DIAS_TIPO.filter((dia) => dias[dia.key]);
  if (marcados.length === DIAS_TIPO.length) {
    return "Todos os dias";
  }
  if (marcados.length === 0) {
    return "—";
  }
  const seguidos = marcados.every(
    (dia, index) => index === 0 || DIAS_TIPO.indexOf(dia) === DIAS_TIPO.indexOf(marcados[index - 1]) + 1,
  );
  if (seguidos && marcados.length >= 3) {
    return `${marcados[0].curto} a ${marcados[marcados.length - 1].curto}`;
  }
  return marcados.map((dia) => dia.curto).join(", ");
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

// CPF de condutor na ficha de consulta: só os 3 primeiros e os 2 últimos dígitos ("529.***.***-25").
export function maskCpfParcial(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  return digits.length === 11 ? `${digits.slice(0, 3)}.***.***-${digits.slice(9)}` : "***.***.***-**";
}
