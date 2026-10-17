import { DIAS_SEMANA_PRECO, type PrecoHorarioValues } from "@/types/preco";

const SEM_HORARIOS = "nenhum ainda";

interface DiaComIntervalos {
  codigo: number;
  label: string;
  intervalos: string;
}

function abreviar(label: string): string {
  return label.slice(0, 3);
}

function intervalosDoDia(horarios: PrecoHorarioValues[], codigo: number): string {
  return horarios
    .filter((horario) => horario.ativo && Number(horario.diaSemana) === codigo && horario.horaInicio && horario.horaFim)
    .map((horario) => `${horario.horaInicio}–${horario.horaFim}`)
    .sort((a, b) => a.localeCompare(b))
    .join(", ");
}

// "Seg–Sex 06:00–22:00 · Sáb 08:00–18:00": dias seguidos com o mesmo intervalo viram uma faixa de dias.
// Horários desativados não contam; sem nenhum horário ativo devolve "nenhum ainda".
export function resumoHorarios(horarios: PrecoHorarioValues[]): string {
  const dias: DiaComIntervalos[] = DIAS_SEMANA_PRECO.map((dia) => ({
    codigo: dia.codigo,
    label: abreviar(dia.label),
    intervalos: intervalosDoDia(horarios, dia.codigo),
  }));

  const grupos: DiaComIntervalos[][] = [];
  for (const dia of dias) {
    if (dia.intervalos === "") {
      grupos.push([]);
      continue;
    }
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.length > 0 && ultimo[0].intervalos === dia.intervalos) {
      ultimo.push(dia);
    } else {
      grupos.push([dia]);
    }
  }

  const textos = grupos
    .filter((grupo) => grupo.length > 0)
    .map((grupo) => {
      const rotulo = grupo.length === 1 ? grupo[0].label : `${grupo[0].label}–${grupo[grupo.length - 1].label}`;
      return `${rotulo} ${grupo[0].intervalos}`;
    });

  return textos.length > 0 ? textos.join(" · ") : SEM_HORARIOS;
}
