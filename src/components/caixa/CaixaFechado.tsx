"use client";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { EmptyPanel, PanelTitle } from "./Caixa.styles";

export function CaixaFechado({ onAbrir }: { onAbrir: () => void }) {
  return (
    <EmptyPanel>
      <PanelTitle>Caixa fechado</PanelTitle>
      <Text variant="muted">
        Não há caixa aberto. Abra o caixa informando o fundo para iniciar o primeiro turno.
      </Text>
      <Button type="button" onClick={onAbrir}>
        Abrir caixa
      </Button>
    </EmptyPanel>
  );
}
