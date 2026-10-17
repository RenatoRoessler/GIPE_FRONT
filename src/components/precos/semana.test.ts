import { describe, expect, it } from "vitest";
import type { PrecoRegraView } from "@/types/preco";
import { montarSemana } from "./semana";

function regra(diaSemana: number, extra: Partial<PrecoRegraView> = {}): PrecoRegraView {
  return { diaSemana, horaInicio: "06:00:00", horaFim: "22:00:00", dataInicio: null, dataFim: null, ativo: true, ...extra };
}

describe("montarSemana", () => {
  it("devolve sempre sete linhas, de domingo a sábado", () => {
    const semana = montarSemana([]);
    expect(semana).toHaveLength(7);
    expect(semana.map((linha) => linha.dia.codigo)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(semana[0].dia.label).toBe("Domingo");
    expect(semana[6].dia.label).toBe("Sábado");
  });

  it("sem regras todos os dias ficam sem cobrança", () => {
    for (const linha of montarSemana([])) {
      expect(linha).toMatchObject({ tipo: "sem_cobranca", texto: "Sem cobrança", trechos: [], inativa: false });
    }
  });

  it("dia sem regra fica sem cobrança e o dia com regra mostra o intervalo", () => {
    const [domingo, segunda] = montarSemana([regra(2)]);
    expect(domingo.tipo).toBe("sem_cobranca");
    expect(segunda).toMatchObject({ tipo: "intervalo", texto: "06:00–22:00" });
  });

  it("calcula o trilho em frações do dia", () => {
    const [, segunda] = montarSemana([regra(2, { horaInicio: "06:00:00", horaFim: "18:00:00" })]);
    expect(segunda.trechos[0].de).toBeCloseTo(0.25);
    expect(segunda.trechos[0].ate).toBeCloseTo(0.75);
  });

  it("aceita horários sem segundos", () => {
    const [, segunda] = montarSemana([regra(2, { horaInicio: "08:30", horaFim: "12:00" })]);
    expect(segunda.texto).toBe("08:30–12:00");
    expect(segunda.trechos[0].de).toBeCloseTo(8.5 / 24);
  });

  it("horários nulos significam dia inteiro", () => {
    const [, segunda] = montarSemana([regra(2, { horaInicio: null, horaFim: null })]);
    expect(segunda).toMatchObject({ tipo: "dia_inteiro", texto: "Dia inteiro" });
    expect(segunda.trechos[0]).toMatchObject({ de: 0, ate: 1, inicio: null, fim: null });
  });

  it("trata 24:00 como o fim do dia e limita o trilho a 1", () => {
    const [, segunda] = montarSemana([regra(2, { horaInicio: "00:00:00", horaFim: "24:00:00" })]);
    expect(segunda.trechos[0].ate).toBe(1);
    expect(segunda.texto).toBe("00:00–24:00");
  });

  it("não deixa o trilho andar para trás quando o fim vem antes do início", () => {
    const [, segunda] = montarSemana([regra(2, { horaInicio: "22:00:00", horaFim: "06:00:00" })]);
    expect(segunda.trechos[0].ate).toBeGreaterThanOrEqual(segunda.trechos[0].de);
  });

  it("junta vários intervalos do mesmo dia em ordem", () => {
    const [, segunda] = montarSemana([
      regra(2, { horaInicio: "14:00:00", horaFim: "18:00:00" }),
      regra(2, { horaInicio: "06:00:00", horaFim: "10:00:00" }),
    ]);
    expect(segunda.trechos).toHaveLength(2);
    expect(segunda.texto).toBe("06:00–10:00, 14:00–18:00");
  });

  it("marca o dia como inativo só quando todas as regras dele estão desativadas", () => {
    const [, segunda, terca] = montarSemana([
      regra(2, { ativo: false }),
      regra(3, { ativo: false }),
      regra(3, { horaInicio: "10:00:00", horaFim: "12:00:00" }),
    ]);
    expect(segunda.inativa).toBe(true);
    expect(segunda.trechos[0].inativo).toBe(true);
    expect(terca.inativa).toBe(false);
  });

  it("descreve o período específico da regra", () => {
    const semana = montarSemana([
      regra(2, { dataInicio: "2025-12-01", dataFim: "2026-01-31" }),
      regra(3, { dataInicio: "2025-12-01" }),
      regra(4, { dataFim: "2026-01-31" }),
      regra(5),
    ]);
    expect(semana[1].trechos[0].periodo).toBe("de 01/12/2025 a 31/01/2026");
    expect(semana[2].trechos[0].periodo).toBe("a partir de 01/12/2025");
    expect(semana[3].trechos[0].periodo).toBe("até 31/01/2026");
    expect(semana[4].trechos[0].periodo).toBeUndefined();
  });

  it("ignora regras de dias fora de domingo a sábado", () => {
    const semana = montarSemana([regra(9)]);
    expect(semana.every((linha) => linha.tipo === "sem_cobranca")).toBe(true);
  });
});
