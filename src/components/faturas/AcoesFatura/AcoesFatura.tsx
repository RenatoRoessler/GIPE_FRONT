"use client";

import { Button } from "@/components/ui/Button";
import type { Fatura } from "@/types/fatura";
import { Acoes } from "../Faturas.styles";
import { BarraAcoes } from "../FaturasMobile.styles";
import { podeCancelar, podePagar } from "../situacao";

export interface AcoesFaturaProps {
  fatura: Pick<Fatura, "situacao">;
  // "heroi": dentro do cartão da fatura (computador e tablet). "barra": barra fixa do celular, com o cancelamento à esquerda.
  lugar: "heroi" | "barra";
  onPagar: () => void;
  onCancelar: () => void;
}

// Registrar pagamento e cancelar: só existem para fatura aberta (nada desabilitado e sem explicação nas demais).
export function AcoesFatura({ fatura, lugar, onPagar, onCancelar }: AcoesFaturaProps) {
  const pagar = podePagar(fatura);
  const cancelar = podeCancelar(fatura);

  if (!pagar && !cancelar) {
    return null;
  }

  const botaoPagar = pagar && (
    <Button type="button" onClick={onPagar}>
      Registrar pagamento
    </Button>
  );
  const botaoCancelar = cancelar && (
    <Button type="button" variant="secondary" onClick={onCancelar}>
      Cancelar fatura
    </Button>
  );

  if (lugar === "barra") {
    return (
      <BarraAcoes>
        {botaoCancelar}
        {botaoPagar}
      </BarraAcoes>
    );
  }

  return (
    <Acoes>
      {botaoPagar}
      {botaoCancelar}
    </Acoes>
  );
}
