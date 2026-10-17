import { parseMoney } from "@/lib/money";
import type { PrecoFaixaValues } from "@/types/preco";
import { formatBRL, formatMinutos } from "./format";

interface Degrau {
  minutos: number;
  valor: number;
}

function degrausValidos(faixas: PrecoFaixaValues[]): Degrau[] {
  return faixas
    .map((faixa) => ({ minutos: Number(faixa.minutosLimite), valor: parseMoney(faixa.valor) }))
    .filter((degrau) => Number.isInteger(degrau.minutos) && degrau.minutos > 0 && Number.isFinite(degrau.valor));
}

// Avisos que ajudam a conferir a tarifa, sem bloquear o salvamento (a validação do formulário é outra).
export function avisosFaixas(faixas: PrecoFaixaValues[], diariaValor: number): string[] {
  const avisos: string[] = [];
  const degraus = degrausValidos(faixas).sort((a, b) => a.minutos - b.minutos);

  if (new Set(degraus.map((degrau) => degrau.minutos)).size !== degraus.length) {
    avisos.push("Duas faixas têm o mesmo limite de tempo.");
  }

  for (let indice = 1; indice < degraus.length; indice++) {
    const anterior = degraus[indice - 1];
    const atual = degraus[indice];
    if (atual.minutos !== anterior.minutos && atual.valor < anterior.valor) {
      avisos.push(`A faixa de ${formatMinutos(atual.minutos)} custa menos que a de ${formatMinutos(anterior.minutos)}.`);
    }
  }

  const ultimo = degraus.at(-1);
  if (ultimo && Number.isFinite(diariaValor) && diariaValor > 0 && diariaValor < ultimo.valor) {
    avisos.push(`A diária (${formatBRL(diariaValor)}) é menor que o último degrau (${formatBRL(ultimo.valor)}).`);
  }

  return avisos;
}
