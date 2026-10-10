"use client";

import { formatBRL, formatMinutos } from "../format";
import { DailyRate, EmptyText, Plate, PlateTitle, Step, Steps, StepValue } from "./FaixasPreview.styles";

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
}

// Aceita lista vazia e valores parciais (a pré-visualização é usada enquanto o usuário digita).
export function FaixasPreview({ faixas, diaria }: FaixasPreviewProps) {
  const ordenadas = [...faixas].sort((a, b) => a.minutosLimite - b.minutosLimite);
  const showDiaria = diaria && Number.isFinite(diaria.valor) && diaria.periodo > 0;

  return (
    <Plate aria-label="Pré-visualização da tabela tarifária">
      <PlateTitle>Tarifa</PlateTitle>
      {ordenadas.length === 0 ? (
        <EmptyText>Adicione faixas para ver a tarifa.</EmptyText>
      ) : (
        <Steps>
          {ordenadas.map((faixa, index) => (
            <Step key={`${faixa.minutosLimite}-${index}`}>
              <span>Até {formatMinutos(faixa.minutosLimite)}</span>
              <StepValue>{formatBRL(faixa.valor)}</StepValue>
            </Step>
          ))}
        </Steps>
      )}
      {showDiaria && (
        <DailyRate>
          Diária de {formatMinutos(diaria.periodo)}: <strong>{formatBRL(diaria.valor)}</strong>
          {Number.isFinite(diaria.adicional) && diaria.adicional > 0 && (
            <> · adicional {formatBRL(diaria.adicional)}</>
          )}
        </DailyRate>
      )}
    </Plate>
  );
}
