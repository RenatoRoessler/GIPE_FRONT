import { calcularGaveta } from "@/components/caixa/gaveta";
import { isTurnoAberto } from "@/components/caixa/format";
import { PELO_CAIXA_SO_DINHEIRO_HOJE } from "@/lib/schemas/financeiro";
import { FORMA_PAGAMENTO, type Turno } from "@/types/caixa";
import { TIPO_LANCAMENTO, type TipoLancamento } from "@/types/financeiro";

export const SEM_TURNO_ABERTO = "Abra o caixa para lançar pela gaveta.";
export const VERIFICANDO_CAIXA = "Verificando o caixa…";
export const CAIXA_CONFERE_AO_SALVAR = "O caixa confere o valor ao salvar.";

export type EstadoPelaGaveta = {
  habilitado: boolean;
  // Por que o controle está desabilitado; nulo quando habilitado.
  motivo: string | null;
  // Dinheiro esperado na gaveta (fundo do turno mais o dinheiro do turno); nulo quando não dá para saber.
  disponivel: number | null;
  // Recado quando o controle vale mas o front não consegue conferir o valor.
  aviso: string | null;
};

export type EntradaPelaGaveta = {
  formaPagamento: string;
  // AAAA-MM-DD.
  dataPagamento: string;
  hoje: string;
  // Turno em andamento; null = não há turno (o back responde 404).
  turno: Turno | null | undefined;
  turnoCarregando: boolean;
  // O perfil não pode consultar o turno (403): a regra final fica com o back.
  turnoSemPermissao: boolean;
};

const desabilitado = (motivo: string): EstadoPelaGaveta => ({ habilitado: false, motivo, disponivel: null, aviso: null });

// "Pelo caixa" só vale em dinheiro, hoje e com turno aberto. O back confere de novo ao salvar.
export function estadoPelaGaveta({ formaPagamento, dataPagamento, hoje, turno, turnoCarregando, turnoSemPermissao }: EntradaPelaGaveta): EstadoPelaGaveta {
  if (formaPagamento !== String(FORMA_PAGAMENTO.Dinheiro) || dataPagamento !== hoje) {
    return desabilitado(PELO_CAIXA_SO_DINHEIRO_HOJE);
  }
  if (turnoSemPermissao) {
    return { habilitado: true, motivo: null, disponivel: null, aviso: CAIXA_CONFERE_AO_SALVAR };
  }
  if (turnoCarregando) {
    return desabilitado(VERIFICANDO_CAIXA);
  }
  if (!turno || !isTurnoAberto(turno)) {
    return desabilitado(SEM_TURNO_ABERTO);
  }
  return { habilitado: true, motivo: null, disponivel: calcularGaveta(turno).naGaveta, aviso: null };
}

// Saída pelo caixa não pode passar do dinheiro na gaveta. Sem o disponível, quem decide é o back.
export function excedeDisponivel({ tipo, valor, disponivel }: { tipo: TipoLancamento; valor: number; disponivel: number | null }): boolean {
  return tipo === TIPO_LANCAMENTO.Saida && disponivel !== null && Number.isFinite(valor) && valor > disponivel + 0.005;
}
