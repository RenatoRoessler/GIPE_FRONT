"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { PageBackground } from "@/components/ui/PageBackground";
import { Text } from "@/components/ui/Text";
import { Header } from "./AuthCard.styles";

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <PageBackground>
      <Card maxWidth="400px">
        <Header>
          <Logo />
          <Text variant="heading" as="h1">
            {title}
          </Text>
          {subtitle && <Text variant="muted">{subtitle}</Text>}
        </Header>
        {children}
      </Card>
    </PageBackground>
  );
}
