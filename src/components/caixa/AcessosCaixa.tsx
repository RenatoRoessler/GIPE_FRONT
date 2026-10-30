"use client";

import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import { AcessoRapido, Acessos } from "./CaixaResumo.styles";

// Atalhos de conferência do caixa aberto, só em tela grande. O histórico depende da permissão própria.
export function AcessosCaixa() {
  const podeVerHistorico = useCan(AREA.CaixaHistorico);

  return (
    <Acessos>
      {podeVerHistorico && <AcessoRapido href="/caixa/historico">Ver Histórico</AcessoRapido>}
      <AcessoRapido href="/caixa/movimentos">Ver movimentos</AcessoRapido>
    </Acessos>
  );
}
