"use client";

import { HTMLAttributes, ReactNode, useId } from "react";
import {
  Chevron,
  Heading,
  Item,
  List,
  Panel,
  Summary,
  Title,
  TitleGroup,
  Trigger,
} from "./Accordion.styles";

export function Accordion(props: HTMLAttributes<HTMLDivElement>) {
  return <List {...props} />;
}

export interface AccordionItemProps {
  title: string;
  summary?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasError?: boolean;
  children: ReactNode;
}

// O painel recolhido continua montado (apenas oculto) para preservar valores e erros dos campos.
export function AccordionItem({
  title,
  summary,
  open,
  onOpenChange,
  hasError = false,
  children,
}: AccordionItemProps) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;

  return (
    <Item $hasError={hasError}>
      <Heading>
        <Trigger
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
        >
          <TitleGroup>
            <Title>{title}</Title>
            {(summary || hasError) && (
              <Summary $hasError={hasError}>
                {hasError ? "Há campos para corrigir" : summary}
              </Summary>
            )}
          </TitleGroup>
          <Chevron
            $open={open}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </Chevron>
        </Trigger>
      </Heading>
      <Panel id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
        {children}
      </Panel>
    </Item>
  );
}
