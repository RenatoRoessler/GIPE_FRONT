"use client";

import { ReactNode, useId } from "react";
import {
  Badge,
  CardAside,
  CardBody,
  CardDetail,
  CardLabel,
  ErrorText,
  Fieldset,
  IconSlot,
  Legend,
  Mark,
  Options,
  RadioInput,
  Tile,
} from "./OptionGroup.styles";

export interface OptionGroupOption {
  value: string;
  label: string;
  // Ícone decorativo (o rótulo continua sendo o nome acessível); com ícone o tile fica em coluna.
  icon?: ReactNode;
  // Só na variante "card": valor em destaque, conteúdo abaixo do nome e selo de texto sobre a borda.
  aside?: ReactNode;
  detail?: ReactNode;
  badge?: string;
  // Nome acessível completo da opção. Substitui o texto do cartão para leitores de tela, então deve repetir tudo o que ele mostra.
  ariaLabel?: string;
}

export interface OptionGroupProps {
  legend: string;
  options: OptionGroupOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  // Fixa o número de colunas em qualquer largura (por padrão, 2 ou 3 conforme o ícone e a tela).
  columns?: number;
  // "card" mostra cada opção como um cartão com mais conteúdo; "inline" só o rádio e o texto, sem caixa; o padrão são tiles de uma linha.
  variant?: "tile" | "card" | "inline";
}

// Escolha única em tiles; usa radios nativos, então setas, foco e leitor de tela vêm do navegador.
export function OptionGroup({
  legend,
  options,
  value,
  onChange,
  disabled = false,
  error,
  columns,
  variant = "tile",
}: OptionGroupProps) {
  const name = useId();
  const card = variant === "card";
  const inline = variant === "inline";

  return (
    <Fieldset disabled={disabled} aria-invalid={Boolean(error)}>
      <Legend>{legend}</Legend>
      <Options $withIcon={!card && options.some((option) => Boolean(option.icon))} $columns={columns} $card={card} $inline={inline}>
        {options.map((option) => {
          const checked = option.value === value;
          const withIcon = !card && !inline && Boolean(option.icon);
          return (
            <Tile
              key={option.value}
              $checked={checked}
              $disabled={disabled}
              $hasError={Boolean(error)}
              $withIcon={withIcon}
              $card={card}
              $inline={inline}
              $highlight={card && Boolean(option.badge)}
            >
              <RadioInput
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                aria-label={option.ariaLabel}
                onChange={() => onChange(option.value)}
              />
              <Mark $checked={checked} $withIcon={withIcon} $card={card} aria-hidden="true" />
              {card ? (
                <>
                  {option.badge && <Badge>{option.badge}</Badge>}
                  <CardBody>
                    <CardLabel>{option.label}</CardLabel>
                    {option.aside && <CardAside>{option.aside}</CardAside>}
                    {option.detail && <CardDetail>{option.detail}</CardDetail>}
                  </CardBody>
                </>
              ) : (
                <>
                  {option.icon && <IconSlot aria-hidden="true">{option.icon}</IconSlot>}
                  {option.label}
                </>
              )}
            </Tile>
          );
        })}
      </Options>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Fieldset>
  );
}
