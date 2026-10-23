import { parseApiDate } from "@/lib/date";
import type { Caixa, Movimento, Turno } from "@/types/caixa";
import { formatMoeda } from "./format";

export type TipoEvento = "abertura" | "retirada" | "passagem" | "fechamento";

export type EventoCaixa = {
  id: string;
  tipo: TipoEvento;
  dataHora: string;
  titulo: string;
  detalhe: string | null;
  autor: string;
};

function instante(iso: string): number {
  return parseApiDate(iso)?.getTime() ?? 0;
}

// Eventos derivados do que a tela já carregou, do mais recente ao mais antigo. Turnos vêm do mais antigo ao mais recente.
export function montarLinhaDoTempo(caixa: Caixa, turnos: Turno[], movimentos: Movimento[]): EventoCaixa[] {
  const eventos: EventoCaixa[] = [
    {
      id: `abertura-${caixa.caixaId}`,
      tipo: "abertura",
      dataHora: caixa.dataHoraAbertura,
      titulo: "Caixa aberto",
      detalhe: `Fundo de caixa ${formatMoeda(caixa.valorFundoCaixa)}`,
      autor: turnos[0]?.usuario ?? "",
    },
  ];

  for (const movimento of movimentos) {
    if (movimento.tipo === "sangria") {
      eventos.push({
        id: `retirada-${movimento.movimentoId}`,
        tipo: "retirada",
        dataHora: movimento.dataHora,
        titulo: `Retirada de ${formatMoeda(movimento.valor)}`,
        detalhe: movimento.motivo,
        autor: movimento.usuario,
      });
    }
  }

  turnos.forEach((turno, indice) => {
    if (indice === 0) {
      return;
    }
    eventos.push({
      id: `passagem-${turno.turnoId}`,
      tipo: "passagem",
      dataHora: turno.dataHoraInicio,
      titulo: `Passagem de turno de ${turnos[indice - 1].usuario} para ${turno.usuario}`,
      detalhe: turnos[indice - 1].observacao,
      autor: turno.usuario,
    });
  });

  if (caixa.dataHoraFechamento) {
    eventos.push({
      id: `fechamento-${caixa.caixaId}`,
      tipo: "fechamento",
      dataHora: caixa.dataHoraFechamento,
      titulo: "Caixa fechado",
      detalhe: null,
      autor: turnos[turnos.length - 1]?.usuario ?? "",
    });
  }

  // Mais recente primeiro; no mesmo instante, o evento criado depois (índice maior) aparece antes.
  return eventos
    .map((evento, ordem) => ({ evento, ordem }))
    .sort((a, b) => instante(b.evento.dataHora) - instante(a.evento.dataHora) || b.ordem - a.ordem)
    .map(({ evento }) => evento);
}
