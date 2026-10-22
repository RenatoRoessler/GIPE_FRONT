"use client";

import { QrCode } from "@/components/ui/QrCode";
import { Divider, QrBlock, QrLink } from "../Recibo.styles";

export interface QrReciboProps {
  // Endereço da página pública do recibo; sem ele, o bloco não existe.
  link: string | null | undefined;
}

// QR que leva o cliente ao recibo no celular. Sem o código do recibo, some sem deixar espaço nem aviso.
export function QrRecibo({ link }: QrReciboProps) {
  if (!link) {
    return null;
  }

  return (
    <>
      <Divider />
      <QrBlock>
        <QrCode value={link} label="QR code do recibo de saída" size={140} />
        <strong>Leve o recibo no celular</strong>
        <p>Escaneie o código para abrir ou baixar</p>
        <QrLink>{link.replace(/^https?:\/\//, "")}</QrLink>
      </QrBlock>
    </>
  );
}
