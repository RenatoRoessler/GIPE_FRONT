"use client";

import { QRCodeSVG } from "qrcode.react";
import { Frame } from "./QrCode.styles";

export interface QrCodeProps {
  value: string;
  label: string;
  size?: number;
}

// Contraste máximo (preto sobre branco) mesmo no tema escuro: é o que garante a leitura pelo celular.
export function QrCode({ value, label, size = 160 }: QrCodeProps) {
  return (
    <Frame>
      <QRCodeSVG value={value} size={size} level="M" marginSize={4} bgColor="#FFFFFF" fgColor="#000000" role="img" aria-label={label} />
    </Frame>
  );
}
