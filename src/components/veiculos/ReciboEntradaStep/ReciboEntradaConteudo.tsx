"use client";

import { formatDate, formatTime } from "@/components/caixa/format";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { QrCode } from "@/components/ui/QrCode";
import { getCategoriaVeiculoLabel } from "../saida";
import {
  Facts,
  Perforation,
  PlateRow,
  QrBlock,
  ShortLink,
  Ticket,
  TicketFoot,
  TicketHead,
  TicketNumber,
} from "./ReciboEntradaStep.styles";

export type ReciboEntradaData = {
  empresaNome?: string;
  empresaCnpj?: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  placa: string;
  modelo: string | null;
  cor: string | null;
  categoria: number;
  sequencial: number;
  tabela: string | null;
  operador: string | null;
  dataHoraEntrada: string;
  // Entrada registrada como mensalista; o nome do cliente não vai no comprovante.
  mensalista?: boolean;
  // Link da página pública do comprovante; sem token não há QR.
  link: string | null;
};

export function ReciboEntradaConteudo({ data }: { data: ReciboEntradaData }) {
  const veiculo = [data.modelo, data.cor].filter(Boolean).join(" · ");
  const contato = [data.empresaCnpj && `CNPJ ${data.empresaCnpj}`, data.empresaTelefone && `Tel. ${data.empresaTelefone}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Ticket aria-label="Comprovante de entrada">
      <TicketHead>
        {data.empresaNome && <h3>{data.empresaNome}</h3>}
        {data.empresaEndereco && <p>{data.empresaEndereco}</p>}
        {contato && <p>{contato}</p>}
        <p>Comprovante de entrada — Estacionamento</p>
      </TicketHead>
      <PlateRow>
        <PlateDisplay value={data.placa} size="md" />
        <TicketNumber>
          <span>Ticket</span>
          <strong>{data.sequencial}</strong>
        </TicketNumber>
      </PlateRow>
      <Facts>
        <div>
          <dt>Data</dt>
          <dd>{formatDate(data.dataHoraEntrada)}</dd>
        </div>
        <div>
          <dt>Entrada</dt>
          <dd>{formatTime(data.dataHoraEntrada)}</dd>
        </div>
        <div>
          <dt>Veículo</dt>
          <dd>{veiculo || "—"}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>{getCategoriaVeiculoLabel(data.categoria)}</dd>
        </div>
        {data.mensalista && (
          <div>
            <dt>Tipo</dt>
            <dd>Mensalista</dd>
          </div>
        )}
      </Facts>
      {data.link && (
        <>
          <Perforation aria-hidden="true">
            <hr />
          </Perforation>
          <QrBlock>
            <QrCode value={data.link} label="QR code do comprovante de entrada" size={180} />
            <strong>Leve o comprovante no celular</strong>
            <p>Escaneie o código ou fotografe esta tela</p>
            <ShortLink>{data.link.replace(/^https?:\/\//, "")}</ShortLink>
          </QrBlock>
        </>
      )}
      {(data.tabela || data.operador) && (
        <TicketFoot>
          <span>{data.tabela ? `Tarifa: ${data.tabela}` : ""}</span>
          <span>{data.operador ? `Operador: ${data.operador}` : ""}</span>
        </TicketFoot>
      )}
    </Ticket>
  );
}
