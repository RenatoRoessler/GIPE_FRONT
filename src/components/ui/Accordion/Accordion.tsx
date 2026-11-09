"use client";

import { HTMLAttributes, ReactNode, useId } from "react";
import {
  Action,
  Chevron,
  Heading,
  HeaderRow,
  Item,
  Label,
  List,
  Mark,
  Panel,
  Summary,
  Title,
  TitleGroup,
  TitleRow,
  Trigger,
} from "./Accordion.styles";

export function Accordion(props: HTMLAttributes<HTMLDivElement>) {
  return <List {...props} />;
}

// Estado da seção: "pronta" (✓), "pendente" (!), "erro" (!) ou o número da seção.
export type AccordionMark = "pronta" | "pendente" | "erro" | number;

const MARK_LABELS = { pronta: "Seção pronta", pendente: "Seção com pendência", erro: "Seção com erro" } as const;
const MARK_SYMBOLS = { pronta: "✓", pendente: "!", erro: "!" } as const;

export interface AccordionItemProps {
  // id do item, para rolar até ele (ex.: atalho de seção do PainelCadastro).
  id?: string;
  title: string;
  // Texto ou conteúdo rico (ex.: antes → depois) sob o título.
  summary?: ReactNode;
  // Círculo à esquerda do título com o estado da seção.
  marca?: AccordionMark;
  // Selo ao lado do título (ex.: "Alterado").
  etiqueta?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasError?: boolean;
  // Ação ao lado do cabeçalho (ex.: remover o item); fica fora do botão que abre e fecha o painel.
  action?: ReactNode;
  children: ReactNode;
}

// O painel recolhido continua montado (apenas oculto) para preservar valores e erros dos campos.
export function AccordionItem({
  id: itemId,
  title,
  summary,
  marca,
  etiqueta,
  open,
  onOpenChange,
  hasError = false,
  action,
  children,
}: AccordionItemProps) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;

  return (
    <Item id={itemId} $hasError={hasError}>
      <HeaderRow>
        <Heading>
          <Trigger
            type="button"
            id={triggerId}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => onOpenChange(!open)}
          >
            {marca !== undefined && (
              <Mark
                $state={typeof marca === "number" ? "numero" : marca}
                role="img"
                aria-label={typeof marca === "number" ? `Seção ${marca}` : MARK_LABELS[marca]}
              >
                {typeof marca === "number" ? marca : MARK_SYMBOLS[marca]}
              </Mark>
            )}
            <TitleGroup>
              <TitleRow>
                <Title>{title}</Title>
                {etiqueta && <Label>{etiqueta}</Label>}
              </TitleRow>
              {(summary || hasError) && (
                <Summary $hasError={hasError}>{hasError ? "Há campos para corrigir" : summary}</Summary>
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
        {action && <Action>{action}</Action>}
      </HeaderRow>
      <Panel id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
        {children}
      </Panel>
    </Item>
  );
}
