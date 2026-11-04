// Respostas de ConferenciaPatio vistas num servidor de teste em 2026-11-04, com placas, nomes e chaves fictícios.
// Cobre: início (lista), leitura conferida, leitura repetida, placa sem entrada, marcação manual e conferência finalizada.
// Não foram exercitados: a saída e a entrada pela conferência (campo `ajustes` sempre vazio aqui).

const chave = { quadroChaveId: 1, posicao: "A1", patioQuadroId: 1, quadro: "Quadro 1" };

const itemBase = {
  patioId: 100,
  categoria: 3,
  mensalista: false,
  conveniado: false,
  dataConferido: null,
  usuarioIdConferido: null,
  usuarioConferido: null,
  origem: null,
};

export const itemPendente = {
  ...itemBase,
  patioConferenciaItemId: 1,
  placa: "AAA1A11",
  modelo: "Gol",
  cor: "PRATA",
  dataEntrada: "2026-10-15T20:13:08.811851",
  situacao: 1,
  chave,
};

export const itemConferido = {
  ...itemBase,
  patioConferenciaItemId: 2,
  patioId: 101,
  placa: "BBB2B22",
  modelo: "Corolla",
  cor: "rosa",
  dataEntrada: "2026-10-16T10:05:21.988582",
  situacao: 2,
  origem: 2,
  dataConferido: "2026-11-04T11:37:50.95185",
  usuarioIdConferido: 26,
  usuarioConferido: "Operador Teste",
  chave: null,
};

export const itemNaoEncontrado = {
  ...itemBase,
  patioConferenciaItemId: 3,
  patioId: 102,
  placa: "CCC3C33",
  modelo: "CG 125",
  cor: "PRATA",
  categoria: 1,
  dataEntrada: "2026-10-17T10:33:13.854404",
  situacao: 3,
  chave: null,
};

export const semEntradaPendente = {
  patioConferenciaSemEntradaId: 1,
  placa: "ZZZ9Z99",
  dataLeitura: "2026-11-04T11:37:51.198539",
  situacao: 1,
  patioId: null,
};

// POST / (iniciar): 201. GET /aberta e GET /{id} devolvem o mesmo formato.
export const conferenciaAberta = {
  patioConferenciaId: 1,
  caixaId: 4,
  metodo: 2,
  situacao: 1,
  dataInicio: "2026-11-04T11:37:30.742111",
  usuarioIdInicio: 26,
  usuarioInicio: "Operador Teste",
  dataFim: null,
  usuarioIdFim: null,
  usuarioFim: null,
  observacao: null,
  totais: { total: 3, conferidos: 1, faltam: 1, naoEncontrados: 1, semEntrada: 1, divergencias: 2, ajustes: 0 },
  itens: [itemPendente, itemConferido, itemNaoEncontrado],
  semEntrada: [semEntradaPendente],
  ajustes: [],
};

// POST /{id}/finalizar: 200; os pendentes viram "não encontrado" (situação 3).
export const conferenciaFinalizada = {
  ...conferenciaAberta,
  situacao: 2,
  dataFim: "2026-11-04T11:38:03.624809",
  usuarioIdFim: 26,
  usuarioFim: "Operador Teste",
  observacao: "Teste de contrato",
  totais: { total: 3, conferidos: 1, faltam: 0, naoEncontrados: 2, semEntrada: 1, divergencias: 3, ajustes: 0 },
  itens: [{ ...itemPendente, situacao: 3 }, itemConferido, itemNaoEncontrado],
};

// POST /{id}/leituras: 200. `resultado` 1 conferido, 2 já conferido (os dois com `item`), 3 sem entrada (com `semEntrada`).
export const leituraConferido = { resultado: 1, placa: "BBB2B22", item: itemConferido, semEntrada: null };
export const leituraJaConferido = { ...leituraConferido, resultado: 2 };
export const leituraSemEntrada = { resultado: 3, placa: "ZZZ9Z99", item: null, semEntrada: semEntradaPendente };

// GET /resumo: 200 (sem conferência) e depois de uma conferência finalizada.
export const resumoSemConferencia = {
  totalVeiculos: 24,
  avulsos: 21,
  mensais: 1,
  conveniados: 2,
  caixaIdAberto: 4,
  ultimaConferencia: null,
  conferenciaAberta: null,
};

export const resumoComUltima = {
  ...resumoSemConferencia,
  ultimaConferencia: {
    patioConferenciaId: 1,
    caixaId: 4,
    situacao: 2,
    dataFim: "2026-11-04T11:38:03.624809",
    usuarioIdFim: 26,
    usuarioFim: "Operador Teste",
    totalVeiculos: 24,
    totalConferidos: 1,
  },
};
