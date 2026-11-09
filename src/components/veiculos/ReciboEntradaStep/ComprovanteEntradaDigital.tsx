"use client";

import { formatDateTime } from "@/components/caixa/format";
import { QrCode } from "@/components/ui/QrCode";
import { Digital, DigitalEmpresa, DigitalEntrada, DigitalPlaca, DigitalTitulo, DigitalVeiculo } from "./ReciboEntradaStep.styles";
import type { ReciboEntradaData } from "./ReciboEntradaConteudo";

const QR_TAMANHO = 260;

// Mesma composição do Comprovante Digital do pátio, mostrada logo após registrar a entrada.
export function ComprovanteEntradaDigital({ data }: { data: ReciboEntradaData }) {
  const veiculo = [data.modelo ?? "—", data.cor].filter(Boolean).join(" · ");
  const contato = [data.empresaCnpj && `CNPJ ${data.empresaCnpj}`, data.empresaTelefone && `Telefone ${data.empresaTelefone}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Digital aria-label="Comprovante digital de entrada">
      {(data.empresaNome || data.empresaEndereco || contato) && (
        <DigitalEmpresa>
          {data.empresaNome && <b>{data.empresaNome}</b>}
          {data.empresaEndereco && <span>{data.empresaEndereco}</span>}
          {contato && <span>{contato}</span>}
        </DigitalEmpresa>
      )}
      <DigitalTitulo>Comprovante Digital</DigitalTitulo>
      {data.link && <QrCode value={data.link} label={`QR Code do ticket ${data.sequencial}`} size={QR_TAMANHO} />}
      <div>
        <DigitalPlaca>{data.placa}</DigitalPlaca>
      </div>
      <DigitalVeiculo>{veiculo}</DigitalVeiculo>
      <DigitalEntrada>{`Entrada ${formatDateTime(data.dataHoraEntrada)} · Ticket ${data.sequencial}`}</DigitalEntrada>
    </Digital>
  );
}
