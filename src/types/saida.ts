export type SaidaBuscaTipo = "placa" | "sequencial";

// A consulta aceita um único identificador; `valor` já vem normalizado (placa em maiúsculas, números só com dígitos).
export type SaidaBusca = {
  tipo: SaidaBuscaTipo;
  valor: string;
};

// O que o operador informou: o token do cupom é resolvido para uma busca antes de consultar a saída.
export type SaidaIdentificacao = SaidaBusca | { tipo: "token"; valor: string };

export type SaidaConsulta = {
  patioId: number;
  placa: string;
  categoria: number;
  modelo: string | null;
  cor: string | null;
  codigoTicket: number | string;
  sequencial: number;
  mensalista: boolean;
  dataHoraEntrada: string;
  dataHoraSaida: string;
  minutosPermanencia: number;
  rotatividadeId: number | null;
  rotatividadeDescricao: string | null;
  regra: number | null;
  faixaMinutosLimite: number | null;
  horasAdicionais: number | null;
  valor: number;
};

export type SaidaPayload = {
  valor: number;
  formaPagamento: number;
};

export type SaidaRegistrada = {
  patioId: number;
  placa: string;
  dataHoraEntrada: string;
  dataHoraSaida: string;
  minutosPermanencia: number;
  valor: number;
  formaPagamento: number;
};
