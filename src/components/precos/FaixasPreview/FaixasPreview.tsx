"use client";

import { formatBRL, formatMinutos } from "../format";
import {
  ConveniadaTag,
  DailyRate,
  EmptyText,
  Plate,
  PlateHeader,
  PlateTitle,
  type PlateSize,
  Step,
  Steps,
  StepValue,
} from "./FaixasPreview.styles";

export interface FaixasPreviewFaixa {
  minutosLimite: number;
  valor: number;
}

export interface FaixasPreviewDiaria {
  periodo: number;
  valor: number;
  adicional: number;
}

export interface FaixasPreviewProps {
  faixas: FaixasPreviewFaixa[];
  diaria?: FaixasPreviewDiaria;
  // Percentual de desconto da conveniada (tabelas de convênio); mostra o selo no topo da placa.
  conveniadaPercentual?: number | null;
  // "lg" na visualização da tabela; o wizard continua no tamanho padrão.
  size?: PlateSize;
}

// Aceita lista vazia e valores parciais (a pré-visualização é usada enquanto o usuário digita).
export function FaixasPreview({ faixas, diaria, conveniadaPercentual = null, size = "md" }: FaixasPreviewProps) {
  const ordenadas = [...faixas].sort((a, b) => a.minutosLimite - b.minutosLimite);
  const showDiaria = diaria && Number.isFinite(diaria.valor) && diaria.periodo > 0;

  return (
    <Plate aria-label="Pré-visualização da tabela tarifária" $size={size} data-size={size}>
      <PlateHeader>
        <PlateTitle>Tarifa</PlateTitle>
        {conveniadaPercentual ? <ConveniadaTag>Conveniada −{conveniadaPercentual}%</ConveniadaTag> : null}
      </PlateHeader>
      {ordenadas.length === 0 ? (
        <EmptyText>Adicione faixas para ver a tarifa.</EmptyText>
      ) : (
        <Steps>
          {ordenadas.map((faixa, index) => (
            <Step key={`${faixa.minutosLimite}-${index}`} $size={size}>
              <span>Até {formatMinutos(faixa.minutosLimite)}</span>
              <StepValue $size={size}>{formatBRL(faixa.valor)}</StepValue>
            </Step>
          ))}
        </Steps>
      )}
      {showDiaria && (
        <DailyRate $size={size}>
          Diária de {formatMinutos(diaria.periodo)}: <strong>{formatBRL(diaria.valor)}</strong>
          {Number.isFinite(diaria.adicional) && diaria.adicional > 0 && (
            <> · adicional {formatBRL(diaria.adicional)}</>
          )}
        </DailyRate>
      )}
    </Plate>
  );
}
