import type { Caixa, CaixaFechado, Movimento, TipoMovimento } from "@/types/caixa";

// O swagger do caixa descreve as respostas só em texto. Todo palpite sobre nome de campo fica neste arquivo (e em
// types/caixa.ts): quando a API for consultada de verdade, o ajuste é daqui.
type Texto = string | null | undefined;

export type MovimentoDto = {
  movimentoId?: number;
  caixaMovimentoId?: number;
  id?: number;
  dataHora?: Texto;
  dataHoraMovimento?: Texto;
  dataMovimento?: Texto;
  data?: Texto;
  // Número (1 entrada, 2 saída) ou texto ("Entrada", "Saída", "Sangria", "Estorno").
  tipo?: number | string | null;
  tipoMovimento?: number | string | null;
  tipoDescricao?: Texto;
  origem?: number | string | null;
  origemDescricao?: Texto;
  valor?: number | null;
  formaPagamento?: number | null;
  turnoId?: number | null;
  usuario?: Texto;
  usuarioNome?: Texto;
  nomeUsuario?: Texto;
  motivo?: Texto;
  observacao?: Texto;
  descricao?: Texto;
};

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Códigos confirmados na API real: tipo 1 = entrada e 2 = saída; origem 1 = pátio e 2 = sangria.
const TIPO_ENTRADA = 1;
const TIPO_SAIDA = 2;
const ORIGEM_SANGRIA = 2;

// Sangria é saída em dinheiro com origem Sangria; estorno conta como saída.
export function classificarMovimento(dto: MovimentoDto): TipoMovimento {
  if (dto.origem === ORIGEM_SANGRIA) {
    return "sangria";
  }
  const texto = semAcento(
    [dto.tipoDescricao, dto.origemDescricao, dto.tipoMovimento, dto.tipo, dto.origem]
      .filter((parte) => typeof parte === "string")
      .join(" "),
  );
  if (texto.includes("sangria")) {
    return "sangria";
  }
  if (texto.includes("saida") || texto.includes("estorno")) {
    return "saida";
  }
  if (texto.includes("entrada")) {
    return "entrada";
  }
  const codigo = typeof dto.tipo === "number" ? dto.tipo : dto.tipoMovimento;
  if (codigo === TIPO_SAIDA) {
    return "saida";
  }
  if (codigo === TIPO_ENTRADA) {
    return "entrada";
  }
  return (dto.valor ?? 0) < 0 ? "saida" : "entrada";
}

export function fromMovimentoResponse(dto: MovimentoDto): Movimento {
  return {
    movimentoId: dto.movimentoId ?? dto.caixaMovimentoId ?? dto.id ?? 0,
    dataHora: dto.dataHora ?? dto.dataHoraMovimento ?? dto.dataMovimento ?? dto.data ?? "",
    tipo: classificarMovimento(dto),
    valor: typeof dto.valor === "number" && Number.isFinite(dto.valor) ? Math.abs(dto.valor) : 0,
    formaPagamento: dto.formaPagamento ?? null,
    turnoId: dto.turnoId ?? null,
    usuario: dto.usuario ?? dto.usuarioNome ?? dto.nomeUsuario ?? "",
    motivo: dto.motivo ?? dto.observacao ?? dto.descricao ?? null,
  };
}

export type CaixaFechadoDto = Partial<Caixa> & {
  abriu?: Texto;
  fechou?: Texto;
  usuarioAbertura?: Texto;
  usuarioFechamento?: Texto;
  nomeUsuarioAbertura?: Texto;
  nomeUsuarioFechamento?: Texto;
};

export function fromCaixaFechadoResponse(dto: CaixaFechadoDto): CaixaFechado {
  const { abriu, fechou, usuarioAbertura, usuarioFechamento, nomeUsuarioAbertura, nomeUsuarioFechamento, ...caixa } = dto;
  return {
    ...(caixa as Caixa),
    valorFundoCaixa: dto.valorFundoCaixa ?? 0,
    valorTotalEntrada: dto.valorTotalEntrada ?? null,
    valorTotalSaida: dto.valorTotalSaida ?? null,
    dataHoraFechamento: dto.dataHoraFechamento ?? null,
    abriu: abriu ?? usuarioAbertura ?? nomeUsuarioAbertura ?? "",
    fechou: fechou ?? usuarioFechamento ?? nomeUsuarioFechamento ?? "",
  };
}
