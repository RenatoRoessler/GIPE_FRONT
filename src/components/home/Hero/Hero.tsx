"use client";

import { Button } from "@/components/ui/Button";
import { Subtitle, Title, Wrapper } from "./Hero.styles";

export function Hero() {
  return (
    <Wrapper>
      <Title>GIPE</Title>
      <Subtitle>
        A forma mais simples de organizar e acompanhar o que importa, em um
        só lugar.
      </Subtitle>
      <Button variant="primary">Começar agora</Button>
    </Wrapper>
  );
}
