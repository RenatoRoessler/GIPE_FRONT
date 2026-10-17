import { describe, expect, it } from "vitest";
import type { PrecoHorarioValues } from "@/types/preco";
import {
  cabeNaGrade,
  copiarSegundaParaTodos,
  gradeDoAtalho,
  gradeParaHorarios,
  gradeVazia,
  horariosForaDaGrade,
  horariosParaGrade,
  totalDeHoras,
} from "./grade";

function horario(parcial: Partial<PrecoHorarioValues> = {}): PrecoHorarioValues {
  return { diaSemana: "2", horaInicio: "08:00", horaFim: "18:00", dataInicio: "", dataFim: "", ativo: true, ...parcial };
}

describe("horariosParaGrade", () => {
  it("marca as horas cobertas pelo horário no dia certo (código 2 = segunda)", () => {
    const grade = horariosParaGrade([horario()]);
    expect(grade[1].slice(7, 19)).toEqual([false, ...new Array(10).fill(true), false]);
    expect(totalDeHoras(grade)).toBe(10);
  });

  it("fim às 23:59 cobre até as 24 h", () => {
    const grade = horariosParaGrade([horario({ horaInicio: "20:00", horaFim: "23:59" })]);
    expect(grade[1].slice(19)).toEqual([false, true, true, true, true]);
  });

  it("ignora o que a grade não desenha", () => {
    const fora = [
      horario({ horaInicio: "08:30" }),
      horario({ ativo: false }),
      horario({ dataInicio: "2026-12-01" }),
      horario({ diaSemana: "9" }),
    ];
    expect(fora.every((item) => !cabeNaGrade(item))).toBe(true);
    expect(totalDeHoras(horariosParaGrade(fora))).toBe(0);
  });
});

describe("gradeParaHorarios", () => {
  it("gera um horário por trecho contínuo e o fim do dia vira 23:59", () => {
    const grade = gradeVazia();
    for (const hora of [6, 7, 8, 14, 15, 22, 23]) {
      grade[2][hora] = true;
    }
    expect(gradeParaHorarios(grade).map((item) => [item.diaSemana, item.horaInicio, item.horaFim])).toEqual([
      ["3", "06:00", "09:00"],
      ["3", "14:00", "16:00"],
      ["3", "22:00", "23:59"],
    ]);
  });

  it("preserva os horários que a grade não representa", () => {
    const quebrado = horario({ horaInicio: "08:30", horaFim: "12:15" });
    const inativo = horario({ diaSemana: "3", ativo: false });
    const periodo = horario({ diaSemana: "4", dataInicio: "2026-12-01", dataFim: "2027-01-31" });
    const horarios = [horario(), quebrado, inativo, periodo];

    const resultado = gradeParaHorarios(horariosParaGrade(horarios), horariosForaDaGrade(horarios));
    expect(resultado).toHaveLength(4);
    expect(resultado).toEqual(expect.arrayContaining([quebrado, inativo, periodo]));
  });

  it("ida e volta mantém as horas de cobrança", () => {
    const grade = gradeDoAtalho("rotativo");
    expect(horariosParaGrade(gradeParaHorarios(grade))).toEqual(grade);
  });
});

describe("atalhos", () => {
  it("comercial: segunda a sexta, 8h às 18h", () => {
    expect(totalDeHoras(gradeDoAtalho("comercial"))).toBe(5 * 10);
  });

  it("rotativo: segunda a sexta 6h às 22h e sábado 8h às 18h", () => {
    const grade = gradeDoAtalho("rotativo");
    expect(totalDeHoras(grade)).toBe(5 * 16 + 10);
    expect(grade[6].slice(8, 18).every(Boolean)).toBe(true);
    expect(grade[0].some(Boolean)).toBe(false);
  });

  it("24 horas cobre a semana toda", () => {
    expect(totalDeHoras(gradeDoAtalho("24h"))).toBe(168);
  });

  it("só fim de semana: domingo e sábado, 8h às 20h", () => {
    const grade = gradeDoAtalho("fim-de-semana");
    expect(totalDeHoras(grade)).toBe(24);
    expect(grade[0][8]).toBe(true);
    expect(grade[1].some(Boolean)).toBe(false);
  });

  it("copiar a segunda repete o dia nos demais", () => {
    const grade = gradeDoAtalho("comercial");
    grade[3] = new Array<boolean>(24).fill(false);
    const copiada = copiarSegundaParaTodos(grade);
    expect(totalDeHoras(copiada)).toBe(7 * 10);
  });
});
