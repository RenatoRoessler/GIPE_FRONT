// Uma posição (gancho) do quadro, como o GET /Patio/quadro-chaves a devolve.
export type PosicaoQuadro = {
  patioQuadroChaveId: number;
  coluna: number;
  // false quando um veículo no pátio está com a chave nessa posição.
  disponivel: boolean;
};

export type LinhaQuadro = { linha: string; colunas: PosicaoQuadro[] };

export type QuadroChaves = { patioQuadroId: number; nome: string; linhas: LinhaQuadro[] };

// Corpo do POST de criação e de acréscimo: as colunas não precisam ser seguidas.
export type LinhaQuadroPayload = { linha: string; colunas: number[] };

export type QuadroChavesPayload = { nome: string; linhas: LinhaQuadroPayload[] };

// Resposta do PUT /Patio/{idPatio}/quadro-chave.
export type ChaveEscolhida = {
  patioId: number;
  placa: string;
  patioQuadroId: number;
  quadro: string;
  patioQuadroChaveId: number;
  linha: string;
  coluna: number;
};

// Estado de um gancho na grade do quadro.
export type EstadoGancho = "livre" | "selecionado" | "ocupado" | "fora";

// Valores da tela de configuração do quadro.
export type QuadroFormValues = {
  nome: string;
  linhas: number;
  colunas: number;
  // Ganchos marcados como fora de uso, no formato "A1".
  foraDeUso: string[];
};
