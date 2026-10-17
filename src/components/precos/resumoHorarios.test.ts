import { describe, expect, it } from "vitest";
import type { PrecoHorarioValues } from "@/types/preco";
import { resumoHorarios } from "./resumoHorarios";

function horario(dia: number, inicio: string, fim: string, ativo = true): PrecoHorarioValues {
  return { diaSemana: String(dia), horaInicio: inicio, horaFim: fim, dataInicio: "", dataFim: "", ativo };
}

describe("resumoHorarios", () => {
  it("sem horários devolve 'nenhum ainda'", () => {
    expect(resumoHorarios([])).toBe("nenhum ainda");
  });

  it("agrupa dias seguidos com o mesmo intervalo", () => {
    const seg_sex = [2, 3, 4, 5, 6].map((dia) => horario(dia, "06:00", "22:00"));
    expect(resumoHorarios(seg_sex)).toBe("Seg–Sex 06:00–22:00");
  });

  it("separa grupos com intervalos diferentes", () => {
    const horarios = [...[2, 3, 4, 5, 6].map((dia) => horario(dia, "06:00", "22:00")), horario(7, "08:00", "18:00")];
    expect(resumoHorarios(horarios)).toBe("Seg–Sex 06:00–22:00 · Sáb 08:00–18:00");
  });

  it("dias salteados não viram uma faixa de dias", () => {
    expect(resumoHorarios([horario(2, "08:00", "18:00"), horario(4, "08:00", "18:00")])).toBe(
      "Seg 08:00–18:00 · Qua 08:00–18:00",
    );
  });

  it("junta vários intervalos do mesmo dia em ordem", () => {
    expect(resumoHorarios([horario(2, "14:00", "18:00"), horario(2, "06:00", "12:00")])).toBe(
      "Seg 06:00–12:00, 14:00–18:00",
    );
  });

  it("ignora horários desativados", () => {
    expect(resumoHorarios([horario(2, "08:00", "18:00", false)])).toBe("nenhum ainda");
    expect(resumoHorarios([horario(2, "08:00", "18:00"), horario(3, "08:00", "18:00", false)])).toBe("Seg 08:00–18:00");
  });
});
