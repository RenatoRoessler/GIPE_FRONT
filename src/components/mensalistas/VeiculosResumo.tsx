"use client";

import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { MensalistaVeiculo } from "@/types/mensalista";
import { SubText, VeiculosTrigger } from "./Mensalistas.styles";

// No celular uma placa já ocupa metade da linha: mostra uma e o "+N".
const MAX_PLACAS = 2;
const MAX_PLACAS_CELULAR = 1;

export interface VeiculosResumoProps {
  veiculos: MensalistaVeiculo[];
  nome: string;
  onAbrir: () => void;
}

// Sem tooltip (não funciona no celular): as placas são um botão que abre a ficha.
export function VeiculosResumo({ veiculos, nome, onAbrir }: VeiculosResumoProps) {
  const celular = useIsMobile();

  if (veiculos.length === 0) {
    return <SubText>—</SubText>;
  }

  const visiveis = veiculos.slice(0, celular ? MAX_PLACAS_CELULAR : MAX_PLACAS);
  const restantes = veiculos.length - visiveis.length;

  return (
    <VeiculosTrigger type="button" onClick={onAbrir} aria-label={`Ver veículos de ${nome}`}>
      {visiveis.map((veiculo) => (
        <PlateDisplay key={veiculo.placa} value={veiculo.placa} size="sm" />
      ))}
      {restantes > 0 && <StatusBadge tone="neutral">{`+${restantes}`}</StatusBadge>}
    </VeiculosTrigger>
  );
}
