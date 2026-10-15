"use client";

import { formatDateTime } from "@/components/caixa/format";
import { QrCode } from "@/components/ui/QrCode";
import { getCategoriaVeiculoLabel } from "../saida";
import { Divider, ReceiptHeader, ReceiptPlaca, Rows } from "../Recibo.styles";
import { EntradaReceipt, Info, QrBlock } from "./ReciboEntradaStep.styles";

export type ReciboEntradaData = {
  empresaNome?: string;
  empresaCnpj?: string;
  placa: string;
  modelo: string | null;
  cor: string | null;
  categoria: number;
  sequencial: number;
  tabela: string | null;
  dataHoraEntrada: string;
  // Link da página pública com os dados da entrada.
  link: string;
};

export function ReciboEntradaConteudo({ data }: { data: ReciboEntradaData }) {
  const veiculo = [data.modelo, data.cor].filter(Boolean).join(" · ");

  return (
    <EntradaReceipt aria-label="Comprovante de entrada">
      <Info>
      <ReceiptHeader>
        {data.empresaNome && <h3>{data.empresaNome}</h3>}
        {data.empresaCnpj && <p>CNPJ {data.empresaCnpj}</p>}
        <p>Comprovante de entrada — Estacionamento</p>
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
        <dd>{data.sequencial}</dd>
        <dt>Entrada</dt>
        <dd>{formatDateTime(data.dataHoraEntrada)}</dd>
        {data.tabela && (
          <>
            <dt>Tabela</dt>
            <dd>{data.tabela}</dd>
          </>
        )}
      </Rows>
      </Info>
      <QrBlock>
        <QrCode value={data.link} label="QR code do comprovante de entrada" />
        <p>Escaneie para ver os dados da entrada</p>
      </QrBlock>
    </EntradaReceipt>
  );
}
