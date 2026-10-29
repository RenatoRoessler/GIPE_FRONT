"use client";

import { Button } from "@/components/ui/Button";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import { Acoes } from "./CaixaResumo.styles";

export interface AcoesCaixaProps {
  // As ações dependem do turno: ficam desabilitadas até ele existir.
  turnoPronto: boolean;
  onSangria: () => void;
  onTrocarTurno: () => void;
  onFechar: () => void;
}

// Quem pode fazer sangria é o perfil de movimentação (Sangria e Lançar despesa); os demais operam o turno (Trocar turno).
export function AcoesCaixa({ turnoPronto, onSangria, onTrocarTurno, onFechar }: AcoesCaixaProps) {
  const movimenta = useCan(AREA.CaixaSangria);

  return (
    <Acoes>
      {movimenta ? (
        <>
          <Button type="button" variant="secondary" onClick={onSangria} disabled={!turnoPronto}>
            Sangria
          </Button>
          {/* Ainda não existe: fica à vista, sem ação, até o produto definir a despesa. */}
          <Button type="button" variant="secondary" disabled aria-disabled="true" title="Em breve">
            Lançar despesa
          </Button>
        </>
      ) : (
        <Button type="button" variant="secondary" onClick={onTrocarTurno} disabled={!turnoPronto}>
          Trocar turno
        </Button>
      )}
      <Button type="button" onClick={onFechar} disabled={!turnoPronto}>
        Fechar caixa
      </Button>
    </Acoes>
  );
}
