import type { PeriodoNotas } from "@/types/notaFiscal";

const doisDigitos = (valor: number) => String(valor).padStart(2, "0");

// "AAAA-MM-DD" no fuso local (o formato do campo de data), sem passar por UTC.
export function formatDataInput(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

// Período padrão da aba Lançadas: do primeiro dia do mês até hoje.
export function mesAtual(hoje: Date): PeriodoNotas {
  return { de: formatDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate: formatDataInput(hoje) };
}

// "2026-10-01" vira "2026/10/01", como o contrato de `lancadas`.
export function formatDataApi(data: string): string {
  return data.replace(/-/g, "/");
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Mensagens por campo; objeto vazio = período válido.
export function validarPeriodo(periodo: PeriodoNotas): { de?: string; ate?: string } {
  const erros: { de?: string; ate?: string } = {};
  if (!DATA.test(periodo.de)) {
    erros.de = "Informe a data inicial";
  }
  if (!DATA.test(periodo.ate)) {
    erros.ate = "Informe a data final";
  }
  // Datas no formato AAAA-MM-DD se comparam como texto.
  if (!erros.de && !erros.ate && periodo.ate < periodo.de) {
    erros.ate = "A data final deve ser igual ou posterior à inicial";
  }
  return erros;
}
