import { describe, expect, it } from "vitest";
import { DURACAO_TOTAL, FASES, POSE_REPOUSO, poseNoTempo, RUA_Y, terminou, VAGA_Y, type Fase, type Trilho } from "./carroTrajeto";

const TRILHO: Trilho = { inicioX: 600, fimX: -40 };

// Instante no meio da n-ésima ocorrência de uma fase (n = 0 é a primeira).
function meioDa(nome: Fase, n = 0, fracao = 0.5) {
  let inicio = 0;
  let vistas = 0;
  for (const fase of FASES) {
    if (fase.nome === nome) {
      if (vistas === n) return inicio + fase.duracao * fracao;
      vistas += 1;
    }
    inicio += fase.duracao;
  }
  throw new Error(`fase ${nome} #${n} não existe`);
}

describe("carroTrajeto", () => {
  it("a rua passa logo abaixo das vagas, sem tocar a linha de baixo", () => {
    // Carro deitado: meia largura 18; a linha de baixo do símbolo vai até y 149.
    expect(RUA_Y - 18).toBeGreaterThan(149);
    expect(RUA_Y + 18).toBeLessThanOrEqual(188);
  });

  it("começa com o carro na vaga e as luzes apagadas", () => {
    const pose = poseNoTempo(0, TRILHO);
    expect(pose).toMatchObject({ dx: 0, dy: 0, angulo: 0, visivel: true, freio: 0, re: 0, facho: 0 });
  });

  it("dura cerca de 24 segundos e termina em repouso", () => {
    expect(DURACAO_TOTAL).toBeCloseTo(24.1, 5);
    expect(terminou(DURACAO_TOTAL)).toBe(true);
    expect(terminou(DURACAO_TOTAL - 0.01)).toBe(false);
    expect(poseNoTempo(DURACAO_TOTAL + 10, TRILHO)).toEqual(POSE_REPOUSO);
  });

  it("faz dois ciclos: duas saídas e duas entradas", () => {
    const nomes = FASES.map((fase) => fase.nome);
    expect(nomes.filter((nome) => nome === "saida")).toHaveLength(2);
    expect(nomes.filter((nome) => nome === "entrada")).toHaveLength(2);
    expect(nomes.at(-1)).toBe("assentamento");
  });

  it("acende a ré antes de sair e durante a ré", () => {
    expect(poseNoTempo(meioDa("espera", 0, 0.95), TRILHO).re).toBe(1);
    const naRe = poseNoTempo(meioDa("re"), TRILHO);
    expect(naRe.re).toBe(1);
    expect(naRe.dy).toBeGreaterThan(0);
  });

  it("na saída o carro está deitado na rua, apontando para a esquerda", () => {
    const pose = poseNoTempo(meioDa("saida"), TRILHO);
    expect(pose.dy).toBe(RUA_Y - VAGA_Y);
    expect(pose.angulo).toBe(-90);
    expect(pose.facho).toBeGreaterThan(0);
  });

  it("fica invisível enquanto o logo está vazio", () => {
    expect(poseNoTempo(meioDa("vazio"), TRILHO).visivel).toBe(false);
    expect(poseNoTempo(meioDa("vazio", 1), TRILHO).visivel).toBe(false);
  });

  it("freia no fim da entrada e na troca de marcha", () => {
    expect(poseNoTempo(meioDa("entrada", 0, 0.95), TRILHO).freio).toBe(1);
    expect(poseNoTempo(meioDa("entrada", 0, 0.5), TRILHO).freio).toBe(0);
    expect(poseNoTempo(meioDa("troca"), TRILHO).freio).toBe(1);
  });

  it("volta à vaga no fim de cada entrada", () => {
    const parado = poseNoTempo(meioDa("estacionado"), TRILHO);
    expect(parado).toMatchObject({ dx: 0, dy: 0, angulo: 0 });
    const assentando = poseNoTempo(meioDa("assentamento"), TRILHO);
    expect(assentando).toMatchObject({ dx: 0, dy: 0, angulo: 0, freio: 1 });
  });

  it("com o trilho mais largo, a entrada começa mais à direita", () => {
    const inicioDaEntrada = meioDa("entrada", 0, 0.01);
    const estreito = poseNoTempo(inicioDaEntrada, { inicioX: 300, fimX: -40 });
    const largo = poseNoTempo(inicioDaEntrada, { inicioX: 900, fimX: -40 });
    expect(largo.dx).toBeGreaterThan(estreito.dx);
    expect(largo.dy).toBe(RUA_Y - VAGA_Y);
  });
});
