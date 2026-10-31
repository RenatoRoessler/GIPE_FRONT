import { describe, expect, it } from "vitest";
import { EMPTY_BUSINESS_HOURS_DATA } from "@/types/adesao";
import { aplicar24Horas, aplicarSegSex, aplicarTodosOsDias, copiarSegunda } from "./horarios";

describe("aplicarSegSex", () => {
  it("abre de segunda a sexta e fecha sábado e domingo", () => {
    const { horarios } = aplicarSegSex();
    expect(horarios.map((dia) => dia.aberto)).toEqual([false, true, true, true, true, true, false]);
    expect(horarios[1]).toMatchObject({ horarioAbertura: "08:00", horarioFechamento: "18:00" });
  });

  it("equivale ao padrão atual do formulário", () => {
    expect(aplicarSegSex()).toEqual(EMPTY_BUSINESS_HOURS_DATA);
  });
});

describe("aplicarTodosOsDias", () => {
  it("abre os 7 dias com o mesmo horário", () => {
    const { horarios } = aplicarTodosOsDias();
    expect(horarios).toHaveLength(7);
    expect(horarios.every((dia) => dia.aberto && dia.horarioAbertura === "08:00")).toBe(true);
  });
});

describe("aplicar24Horas", () => {
  it("marca os 7 dias como 24 horas, sem horários", () => {
    const { horarios } = aplicar24Horas();
    expect(horarios.every((dia) => dia.aberto && dia.aberto24Horas && dia.horarioAbertura === "")).toBe(true);
  });
});

describe("copiarSegunda", () => {
  it("copia o horário de segunda para todos os dias sem mutar a entrada", () => {
    const entrada = aplicarSegSex();
    entrada.horarios[1] = { aberto: true, aberto24Horas: false, horarioAbertura: "09:00", horarioFechamento: "20:00" };
    const copia = JSON.parse(JSON.stringify(entrada));

    const resultado = copiarSegunda(entrada);

    expect(resultado.horarios.every((dia) => dia.horarioAbertura === "09:00" && dia.horarioFechamento === "20:00")).toBe(
      true,
    );
    expect(entrada).toEqual(copia);
    expect(resultado.horarios[0]).not.toBe(resultado.horarios[1]);
  });
});
