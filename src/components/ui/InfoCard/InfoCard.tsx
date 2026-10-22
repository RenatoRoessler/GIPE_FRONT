"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Body, Container, Content, IconSlot, Title } from "./InfoCard.styles";

export interface InfoCardProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  title: string;
  // Decorativo: o título é quem diz o estado.
  icon?: ReactNode;
}

// Aviso informativo que não pede ação; anunciado uma vez, quando aparece.
export function InfoCard({ title, icon, children, ...props }: InfoCardProps) {
  return (
    <Container role="status" {...props}>
      {icon && <IconSlot aria-hidden="true">{icon}</IconSlot>}
      <Body>
        <Title>{title}</Title>
        {children && <Content>{children}</Content>}
      </Body>
    </Container>
  );
}
