"use client";

import type { ReactNode } from "react";
import { Action, Row, Text, Wrapper, type InlineNoticeVariant } from "./InlineNotice.styles";

export interface InlineNoticeProps {
  children: ReactNode;
  variant?: InlineNoticeVariant;
  // Ação à direita do texto (ex.: "Tentar câmera").
  actionLabel?: string;
  onAction?: () => void;
  // Conteúdo extra sob o texto (ex.: passos para liberar a câmera).
  details?: ReactNode;
}

// Faixa discreta de uma linha: avisa, oferece uma ação e, se precisar, abre um detalhe logo abaixo.
export function InlineNotice({ children, variant = "neutral", actionLabel, onAction, details }: InlineNoticeProps) {
  return (
    <Wrapper $variant={variant} role="status">
      <Row>
        <Text>{children}</Text>
        {actionLabel && onAction && (
          <Action type="button" onClick={onAction}>
            {actionLabel}
          </Action>
        )}
      </Row>
      {details}
    </Wrapper>
  );
}
