// Nota fiscal pedida pelo cliente, aguardando (ou já com) o lançamento da empresa.
// [A CONFIRMAR com o back] O formato das listas (`/nota-fiscal/pendentes` e `/nota-fiscal/lancadas`) não veio no contrato:
// todos os campos são opcionais e a tela mostra só os que existirem.
export type NotaFiscal = {
  notaFiscalId: number | null;
  valor: number | null;
  dataSolicitacao: string | null;
  dataLancamento: string | null;
  // Só dígitos (ou letras, no CNPJ alfanumérico); a tela formata.
  documento: string | null;
  email: string | null;
  placa: string | null;
};

// Corpo do POST /nota-fiscal/cliente/solicitar (público, sem login).
export type SolicitarNotaPayload = {
  // Código do recibo da saída paga (10 caracteres).
  token: string;
  // CPF ou CNPJ, só com os caracteres do documento; ausente quando o cliente não informa.
  documento?: string;
  email: string;
  // Igual ao valor do recibo, até 2 casas.
  valor: number;
};

// Resposta do POST: o que a confirmação do modal mostra.
export type NotaSolicitada = {
  notaFiscalId: number;
  valor: number;
  dataSolicitacao: string;
};

// Período da aba Lançadas, em "AAAA-MM-DD" (o formato do campo de data).
export type PeriodoNotas = {
  de: string;
  ate: string;
};
