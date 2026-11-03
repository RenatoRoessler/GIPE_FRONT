// Posição de cada etapa do fluxo de adesão (a do plano vem logo antes da conferência).
export const ETAPA = { Empresa: 1, Horarios: 2, Titular: 3, Plano: 4, Conferir: 5 } as const;

export type Etapa = (typeof ETAPA)[keyof typeof ETAPA];

// Etapas que a conferência permite corrigir.
export type EtapaEditavel = Exclude<Etapa, typeof ETAPA.Conferir>;

// O modo é definido na abertura da adesão: "plano" escolhe um plano pago, "teste" é o teste grátis (sem etapa Plano).
export const MODO_ADESAO = { Plano: "plano", Teste: "teste" } as const;

export type ModoAdesao = (typeof MODO_ADESAO)[keyof typeof MODO_ADESAO];

// Indexado por `etapa - 1`.
export const NOMES_ETAPAS = ["Empresa", "Horários", "Titular", "Plano", "Conferir"] as const;

// No teste grátis a etapa Plano não existe: nem no Stepper, nem na navegação.
function etapasDoFluxo(modo: ModoAdesao): Etapa[] {
  const todas = Object.values(ETAPA);
  return modo === MODO_ADESAO.Teste ? todas.filter((etapa) => etapa !== ETAPA.Plano) : todas;
}

export function etapasDoModo(modo: ModoAdesao): string[] {
  return etapasDoFluxo(modo).map((etapa) => NOMES_ETAPAS[etapa - 1]);
}

// Posição (1-based) que o usuário vê no Stepper; o número interno da etapa não muda.
export function posicaoDaEtapa(etapa: Etapa, modo: ModoAdesao): number {
  return etapasDoFluxo(modo).indexOf(etapa) + 1;
}

// Inverso de `posicaoDaEtapa`, para o clique no Stepper.
export function etapaDaPosicao(posicao: number, modo: ModoAdesao): Etapa {
  const fluxo = etapasDoFluxo(modo);
  return fluxo[Math.min(Math.max(posicao, 1), fluxo.length) - 1];
}

export function proximaEtapa(etapa: Etapa, modo: ModoAdesao): Etapa {
  const fluxo = etapasDoFluxo(modo);
  return fluxo[Math.min(fluxo.indexOf(etapa) + 1, fluxo.length - 1)];
}

export function etapaAnterior(etapa: Etapa, modo: ModoAdesao): Etapa {
  const fluxo = etapasDoFluxo(modo);
  return fluxo[Math.max(fluxo.indexOf(etapa) - 1, 0)];
}
