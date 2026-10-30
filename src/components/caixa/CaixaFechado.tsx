"use client";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import { EmptyPanel, PanelTitle } from "./Caixa.styles";
import { AcessoRapido, CaixasAnteriores } from "./CaixaResumo.styles";

export function CaixaFechado({ onAbrir }: { onAbrir: () => void }) {
  const podeVerCaixasAnteriores = useCan(AREA.CaixaHistorico);

  return (
    <EmptyPanel>
      <PanelTitle>Caixa fechado</PanelTitle>
      <Text variant="muted">
        Não há caixa aberto. Abra o caixa informando o fundo para iniciar o primeiro turno.
      </Text>
      <Button type="button" onClick={onAbrir}>
        Abrir caixa
      </Button>
      {podeVerCaixasAnteriores && (
        <>
          <CaixasAnteriores href="/caixa/historico">Caixas anteriores</CaixasAnteriores>
          <AcessoRapido href="/caixa/historico">Ver Histórico</AcessoRapido>
        </>
      )}
    </EmptyPanel>
  );
}
