// Posição de cada etapa do fluxo de adesão (a do plano vem logo antes da conferência).
export const ETAPA = { Empresa: 1, Horarios: 2, Titular: 3, Plano: 4, Conferir: 5 } as const;

export type Etapa = (typeof ETAPA)[keyof typeof ETAPA];

// Etapas que a conferência permite corrigir.
export type EtapaEditavel = Exclude<Etapa, typeof ETAPA.Conferir>;
