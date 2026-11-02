export enum TipoPlanoAdesao {
  Trial = 0,
  Mensal = 1,
  Trimestral = 2,
  Semestral = 3,
  Anual = 4,
}

// Trial existe no backend, mas não é oferecido na adesão.
export type PlanoVendido = Exclude<TipoPlanoAdesao, TipoPlanoAdesao.Trial>;

export interface Plano {
  tipo: PlanoVendido;
  nome: string;
  meses: 1 | 3 | 6 | 12;
  // Centavos inteiros: total e economia saem exatos, sem erro de ponto flutuante.
  centavosPorMes: number;
  recomendado?: boolean;
}

export interface AreaDoSistema {
  titulo: string;
  descricao: string;
}
