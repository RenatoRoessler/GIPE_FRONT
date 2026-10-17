import { DIAS_SEMANA_PRECO, type PrecoHorarioValues } from "@/types/preco";

// Grade semanal: [dia][hora]. O dia é o índice em DIAS_SEMANA_PRECO (código - 1) e a hora vai de 0 a 23.
export type Grade = boolean[][];

export type AtalhoGrade = "comercial" | "rotativo" | "24h" | "fim-de-semana";

export const HORAS_NO_DIA = 24;
export const HORAS_NA_SEMANA = DIAS_SEMANA_PRECO.length * HORAS_NO_DIA;

// Fim de expediente às 24 h: o campo de hora do formulário não aceita "24:00", então grava-se 23:59.
const FIM_DO_DIA = "23:59";
const MINUTOS_FIM_DO_DIA = 24 * 60;

const doisDigitos = (valor: number) => String(valor).padStart(2, "0");

export function gradeVazia(): Grade {
  return DIAS_SEMANA_PRECO.map(() => new Array<boolean>(HORAS_NO_DIA).fill(false));
}

function paraMinutos(hora: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(hora.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function limitesEmMinutos(horario: PrecoHorarioValues): { inicio: number; fim: number } | null {
  const inicio = paraMinutos(horario.horaInicio);
  const fimBruto = paraMinutos(horario.horaFim);
  if (inicio === null || fimBruto === null) {
    return null;
  }
  // 23:59 é o "fim do dia" da grade.
  const fim = fimBruto === MINUTOS_FIM_DO_DIA - 1 ? MINUTOS_FIM_DO_DIA : fimBruto;
  return fim > inicio ? { inicio, fim } : null;
}

// A grade só desenha horários ativos, sem período específico e em horas cheias; o resto fica no ajuste fino.
export function cabeNaGrade(horario: PrecoHorarioValues): boolean {
  const limites = limitesEmMinutos(horario);
  const dia = Number(horario.diaSemana);
  return (
    horario.ativo &&
    horario.dataInicio === "" &&
    horario.dataFim === "" &&
    limites !== null &&
    limites.inicio % 60 === 0 &&
    limites.fim % 60 === 0 &&
    Number.isInteger(dia) &&
    dia >= 1 &&
    dia <= DIAS_SEMANA_PRECO.length
  );
}

export function horariosParaGrade(horarios: PrecoHorarioValues[]): Grade {
  const grade = gradeVazia();
  for (const horario of horarios.filter(cabeNaGrade)) {
    const limites = limitesEmMinutos(horario);
    if (!limites) {
      continue;
    }
    const dia = Number(horario.diaSemana) - 1;
    for (let hora = limites.inicio / 60; hora < limites.fim / 60; hora++) {
      grade[dia][hora] = true;
    }
  }
  return grade;
}

// Um horário por trecho contínuo de cada dia. `outros` são os horários que a grade não desenha e que ela preserva.
export function gradeParaHorarios(grade: Grade, outros: PrecoHorarioValues[] = []): PrecoHorarioValues[] {
  const gerados: PrecoHorarioValues[] = [];
  grade.forEach((linha, dia) => {
    let inicio: number | null = null;
    for (let hora = 0; hora <= HORAS_NO_DIA; hora++) {
      const ligada = hora < HORAS_NO_DIA && linha[hora];
      if (ligada && inicio === null) {
        inicio = hora;
      }
      if (!ligada && inicio !== null) {
        gerados.push({
          diaSemana: String(dia + 1),
          horaInicio: `${doisDigitos(inicio)}:00`,
          horaFim: hora === HORAS_NO_DIA ? FIM_DO_DIA : `${doisDigitos(hora)}:00`,
          dataInicio: "",
          dataFim: "",
          ativo: true,
        });
        inicio = null;
      }
    }
  });
  return [...gerados, ...outros];
}

export function horariosForaDaGrade(horarios: PrecoHorarioValues[]): PrecoHorarioValues[] {
  return horarios.filter((horario) => !cabeNaGrade(horario));
}

export function totalDeHoras(grade: Grade): number {
  return grade.reduce((total, linha) => total + linha.filter(Boolean).length, 0);
}

// Códigos de dia da semana (1 = domingo ... 7 = sábado, como em DIAS_SEMANA_PRECO).
const DOMINGO = 1;
const SABADO = 7;
const SEGUNDA_A_SEXTA = [2, 3, 4, 5, 6];

function pintar(grade: Grade, codigos: number[], de: number, ate: number) {
  for (const codigo of codigos) {
    for (let hora = de; hora < ate; hora++) {
      grade[codigo - 1][hora] = true;
    }
  }
}

export function gradeDoAtalho(atalho: AtalhoGrade): Grade {
  const grade = gradeVazia();
  switch (atalho) {
    case "comercial":
      pintar(grade, SEGUNDA_A_SEXTA, 8, 18);
      break;
    case "rotativo":
      pintar(grade, SEGUNDA_A_SEXTA, 6, 22);
      pintar(grade, [SABADO], 8, 18);
      break;
    case "24h":
      pintar(
        grade,
        DIAS_SEMANA_PRECO.map((dia) => dia.codigo),
        0,
        HORAS_NO_DIA,
      );
      break;
    case "fim-de-semana":
      pintar(grade, [DOMINGO, SABADO], 8, 20);
      break;
  }
  return grade;
}

// Copia o dia de referência (segunda-feira) para todos os outros dias.
export function copiarSegundaParaTodos(grade: Grade): Grade {
  const segunda = grade[SEGUNDA_A_SEXTA[0] - 1];
  return grade.map(() => [...segunda]);
}
