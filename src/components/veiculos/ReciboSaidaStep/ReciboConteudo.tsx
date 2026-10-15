"use client";

import { formatDateTime } from "@/components/caixa/format";
import { formatMinutos } from "@/components/precos/format";
import { formatBRL } from "@/lib/money";
import { getCategoriaVeiculoLabel, getFormaPagamentoLabel } from "../saida";
import { Divider, Receipt, ReceiptHeader, ReceiptPlaca, Rows } from "../Recibo.styles";
import { Total } from "./ReciboSaidaStep.styles";

export type ReciboData = {
  empresaNome?: string;
  empresaCnpj?: string;
  emitidoEm: string;
  placa: string;
  modelo: string | null;
  cor: string | null;
  categoria: number;
  codigoTicket: number;
  tabela: string | null;
  dataHoraEntrada: string;
  dataHoraSaida: string;
  minutosPermanencia: number;
  formaPagamento: number;
  valor: number;
  // Só em dinheiro.
  recebido: number | null;
  troco: number | null;
};

export function ReciboConteudo({ data }: { data: ReciboData }) {
  const veiculo = [data.modelo, data.cor].filter(Boolean).join(" · ");

  return (
    <Receipt aria-label="Recibo de pagamento">
      <ReceiptHeader>
        {data.empresaNome && <h3>{data.empresaNome}</h3>}
        {data.empresaCnpj && <p>CNPJ {data.empresaCnpj}</p>}
        <p>Recibo de pagamento — Estacionamento</p>
        <p>Emitido em {formatDateTime(data.emitidoEm)}</p>
      </ReceiptHeader>
      <Divider />
      <ReceiptPlaca>{data.placa}</ReceiptPlaca>
      <Rows>
        {veiculo && (
          <>
            <dt>Veículo</dt>
            <dd>{veiculo}</dd>
          </>
        )}
        <dt>Categoria</dt>
        <dd>{getCategoriaVeiculoLabel(data.categoria)}</dd>
        <dt>Ticket</dt>
        <dd>{data.codigoTicket}</dd>
        <dt>Entrada</dt>
        <dd>{formatDateTime(data.dataHoraEntrada)}</dd>
        <dt>Saída</dt>
        <dd>{formatDateTime(data.dataHoraSaida)}</dd>
        <dt>Permanência</dt>
        <dd>{formatMinutos(data.minutosPermanencia)}</dd>
        {data.tabela && (
          <>
            <dt>Tabela</dt>
            <dd>{data.tabela}</dd>
          </>
        )}
      </Rows>
      <Divider />
      <Rows>
        <dt>Pagamento</dt>
        <dd>{getFormaPagamentoLabel(data.formaPagamento)}</dd>
        {data.recebido !== null && (
          <>
            <dt>Valor recebido</dt>
            <dd>{formatBRL(data.recebido)}</dd>
            <dt>Troco</dt>
            <dd>{formatBRL(data.troco ?? 0)}</dd>
          </>
        )}
      </Rows>
      <Divider />
      <Total>
        Total pago
        <strong>{formatBRL(data.valor)}</strong>
      </Total>
    </Receipt>
  );
}
