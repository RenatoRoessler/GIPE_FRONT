"use client";

import type { ResumoPatioConveniada } from "@/types/patioConveniada";
import { Bloco, Chip, Chips, Total } from "./ResumoConveniada.styles";

export interface ResumoConveniadaProps {
  resumo: ResumoPatioConveniada;
  // Estacionamento escolhido (`null` = todos).
  estacionamento: number | null;
  onEstacionamentoChange: (empresaId: number | null) => void;
}

// O total do pátio da conveniada e, só com mais de um estacionamento, os chips que filtram por ele.
// Tocar de novo no chip ativo volta a "Todos".
export function ResumoConveniada({ resumo, estacionamento, onEstacionamentoChange }: ResumoConveniadaProps) {
  const varios = resumo.porEstacionamento.length > 1;

  return (
    <Bloco aria-label="Resumo do pátio">
      <Total>
        <b>{resumo.total}</b>
        {resumo.total === 1 ? "veículo no pátio" : "veículos no pátio"}
      </Total>
      {varios && (
        <Chips role="group" aria-label="Estacionamento">
          <Chip type="button" aria-pressed={estacionamento === null} onClick={() => onEstacionamentoChange(null)}>
            Todos
            <strong>{resumo.total}</strong>
          </Chip>
          {resumo.porEstacionamento.map((item) => (
            <Chip
              key={item.empresaId}
              type="button"
              aria-pressed={estacionamento === item.empresaId}
              onClick={() => onEstacionamentoChange(estacionamento === item.empresaId ? null : item.empresaId)}
            >
              {item.nome}
              <strong>{item.total}</strong>
            </Chip>
          ))}
        </Chips>
      )}
    </Bloco>
  );
}
