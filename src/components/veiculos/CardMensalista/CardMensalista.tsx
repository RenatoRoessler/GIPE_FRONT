"use client";

import type { ReactNode } from "react";
import { InfoCard } from "@/components/ui/InfoCard";

export type CardMensalistaContexto = "entrada" | "saida";
// `rotativo`: é mensalista, mas está fora do plano contratado e entra como rotativo (só na entrada).
export type CardMensalistaVariante = "mensalista" | "rotativo";

export interface CardMensalistaProps {
  nome?: string | null;
  contexto: CardMensalistaContexto;
  variante?: CardMensalistaVariante;
  // Horário contratado ("HH:mm"); só aparece na variante `rotativo`.
  horario?: { de: string; ate: string } | null;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const CartaoIcon = (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </Icon>
);

const RelogioIcon = (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export function CardMensalista({ nome, contexto, variante = "mensalista", horario }: CardMensalistaProps) {
  if (variante === "rotativo") {
    return (
      <InfoCard title="Mensalista fora do horário" icon={RelogioIcon}>
        {nome && <span title={nome}>{nome}</span>}
        <span>A entrada será registrada como rotativo e cobrada normalmente.</span>
        {horario && (
          <span>
            Horário contratado: {horario.de} às {horario.ate}.
          </span>
        )}
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Mensalista" icon={CartaoIcon}>
      {nome && <span title={nome}>{nome}</span>}
      <span>{contexto === "entrada" ? "A entrada será registrada como mensalista." : "Saída sem cobrança."}</span>
    </InfoCard>
  );
}
