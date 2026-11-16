"use client";

import { formatBRL } from "@/lib/money";
import { Amount, Box, Label, Received } from "./ChangeDisplay.styles";

export interface ChangeDisplayProps {
  // Valor que o cliente entregou; nulo (ainda não informado) não mostra nada.
  recebido: number | null;
  // Valor a cobrar.
  valor: number;
}

// Em centavos, para não depender de ponto flutuante.
const emCentavos = (valor: number) => Math.round(valor * 100);

// Troco em destaque. O estado vai sempre em texto ("Troco", "Sem troco", "Faltam R$ X"); a cor só reforça.
export function ChangeDisplay({ recebido, valor }: ChangeDisplayProps) {
  const pronto = recebido !== null && !Number.isNaN(recebido);
  return <div aria-live="polite">{pronto && <Conteudo recebido={recebido} valor={valor} />}</div>;
}

function Conteudo({ recebido, valor }: { recebido: number; valor: number }) {
  if (emCentavos(recebido) < emCentavos(valor)) {
    return (
      <Box $tone="danger">
        <Label>Valor insuficiente</Label>
        <Amount $tone="danger">Faltam {formatBRL(valor - recebido)}</Amount>
      </Box>
    );
  }
  const troco = (emCentavos(recebido) - emCentavos(valor)) / 100;
  return (
    <Box $tone="success">
      <Label>Troco</Label>
      <Amount $tone="success">{troco === 0 ? "Sem troco" : formatBRL(troco)}</Amount>
      <Received>recebido {formatBRL(recebido)}</Received>
    </Box>
  );
}
