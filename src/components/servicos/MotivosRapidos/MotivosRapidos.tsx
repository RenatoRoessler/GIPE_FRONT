"use client";

import { Chip, Grupo, Legenda, Lista } from "./MotivosRapidos.styles";

// Os motivos que mais aparecem no pátio. Escolher um preenche o campo de motivo; quem precisa de outro escreve o seu.
export const MOTIVOS_RAPIDOS = ["Cliente desistiu", "Cliente com pressa", "Sem horário hoje", "Lançado por engano"] as const;

export interface MotivosRapidosProps {
  // O motivo que está no campo agora: o chip igual a ele fica marcado.
  valor: string;
  onEscolher: (motivo: string) => void;
  desabilitado?: boolean;
}

export function MotivosRapidos({ valor, onEscolher, desabilitado = false }: MotivosRapidosProps) {
  return (
    <Grupo role="group" aria-labelledby="motivos-rapidos">
      <Legenda id="motivos-rapidos">Motivos mais comuns</Legenda>
      <Lista>
        {MOTIVOS_RAPIDOS.map((motivo) => (
          <Chip key={motivo} type="button" $marcado={valor === motivo} aria-pressed={valor === motivo} disabled={desabilitado} onClick={() => onEscolher(motivo)}>
            {motivo}
          </Chip>
        ))}
      </Lista>
    </Grupo>
  );
}
