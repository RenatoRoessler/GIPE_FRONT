// Valores do contrato com o backend. Quais planos existem de fato vem de `GET /Plano`; o código só nomeia o Trial.
export enum TipoPlanoAdesao {
  Trial = 0,
  Mensal = 1,
  Trimestral = 2,
  Semestral = 3,
  Anual = 4,
}

// Plano devolvido por `GET /Plano`, já pronto para exibir.
export interface PlanoAdesao {
  id: number;
  // `tipoPeriodoPlano`: é o valor enviado em `tipoPlanoAdesao` no cadastro.
  tipo: number;
  nome: string;
  meses: number;
  // Centavos inteiros: evita erro de ponto flutuante.
  centavosTabela: number;
  centavosAtual: number;
  emPromocao: boolean;
  // Só a data ("AAAA-MM-DD") do fim da promoção, como o back-end informa.
  promocaoAte?: string;
}

export interface AreaDoSistema {
  titulo: string;
  descricao: string;
}
