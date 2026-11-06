// Os valores 2 a 4 continuam no contrato com o backend; o sistema só vende o Mensal.
export enum TipoPlanoAdesao {
  Trial = 0,
  Mensal = 1,
  Trimestral = 2,
  Semestral = 3,
  Anual = 4,
}

// Trial existe no backend, mas não é oferecido na adesão.
export type PlanoVendido = TipoPlanoAdesao.Mensal;

export interface Plano {
  tipo: PlanoVendido;
  nome: string;
  // Centavos inteiros: evita erro de ponto flutuante.
  centavosPorMes: number;
  centavosLancamento: number;
  mesesDeLancamento: number;
}

export interface AreaDoSistema {
  titulo: string;
  descricao: string;
}
