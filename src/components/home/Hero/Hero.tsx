"use client";

import { Button } from "@/components/ui/Button";
import { Subtitle, Title, Wrapper } from "./Hero.styles";

export function Hero() {
  return (
    <Wrapper>
      <Title>Murel</Title>
      <Subtitle>
        A Murel controla entrada, saída e caixa de estacionamentos, valets e
        lava-rápidos. Sem impressora e sem cadastro do cliente.
      </Subtitle>
      <Button variant="primary">Começar agora</Button>
    </Wrapper>
  );
}
