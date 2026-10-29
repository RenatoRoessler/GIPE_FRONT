"use client";

import { ChangeEvent, InputHTMLAttributes, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ErrorText, Field, Label, StyledInput } from "@/components/ui/Input/Input.styles";
import { Skeleton } from "@/components/ui/Skeleton";
import { Listbox, Match, Message, Option, VisuallyHidden } from "./Combobox.styles";

export type ComboboxOption = {
  id: string | number;
  label: string;
  // Trecho digitado, em destaque dentro do rótulo.
  destaque?: { antes: string; casado: string; depois: string };
};

export interface ComboboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onSelect" | "role" | "size"> {
  label: string;
  value: string;
  onChange: (texto: string) => void;
  onSelect?: (option: ComboboxOption) => void;
  // Já filtradas por quem usa o componente.
  options: ComboboxOption[];
  loading?: boolean;
  error?: string;
  // Mostrada quando há texto e nenhuma opção; o texto digitado continua valendo.
  emptyText?: string;
}

// Campo de texto livre com sugestões (padrão ARIA combobox com lista). Só sugere: nunca bloqueia o que foi digitado.
export function Combobox({
  label,
  value,
  onChange,
  onSelect,
  options,
  loading = false,
  error,
  emptyText,
  id,
  disabled,
  onBlur,
  onKeyDown,
  ...props
}: ComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const listaRef = useRef<HTMLUListElement>(null);

  const temTexto = value.trim() !== "";
  const mostrarLista = aberto && !disabled && options.length > 0;
  const mostrarCarregando = aberto && !disabled && temTexto && loading && options.length === 0;
  const mostrarVazio = aberto && !disabled && temTexto && !loading && options.length === 0 && Boolean(emptyText);
  const ativoValido = mostrarLista && ativo >= 0 && ativo < options.length ? ativo : -1;

  useEffect(() => {
    if (ativoValido < 0) {
      return;
    }
    listaRef.current?.children[ativoValido]?.scrollIntoView?.({ block: "nearest" });
  }, [ativoValido]);

  function escolher(option: ComboboxOption) {
    onChange(option.label);
    onSelect?.(option);
    setAberto(false);
    setAtivo(-1);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
    setAberto(true);
    setAtivo(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    const total = options.length;
    switch (event.key) {
      case "ArrowDown":
        if (total === 0) {
          return;
        }
        event.preventDefault();
        setAberto(true);
        setAtivo(mostrarLista ? (ativoValido + 1) % total : 0);
        break;
      case "ArrowUp":
        if (!mostrarLista) {
          return;
        }
        event.preventDefault();
        setAtivo(ativoValido <= 0 ? total - 1 : ativoValido - 1);
        break;
      case "Home":
      case "End":
        if (ativoValido < 0) {
          return;
        }
        event.preventDefault();
        setAtivo(event.key === "Home" ? 0 : total - 1);
        break;
      case "Enter":
        // Sem opção ativa, o Enter segue o caminho normal do formulário e o texto digitado vale.
        if (ativoValido >= 0) {
          event.preventDefault();
          escolher(options[ativoValido]);
        }
        break;
      case "Escape":
        if (aberto) {
          event.preventDefault();
          event.stopPropagation();
          setAberto(false);
          setAtivo(-1);
        }
        break;
    }
  }

  const resumo = mostrarLista
    ? `${options.length} ${options.length === 1 ? "sugestão" : "sugestões"}`
    : mostrarVazio
      ? (emptyText ?? "")
      : "";

  return (
    <Field>
      <Label htmlFor={inputId}>{label}</Label>
      <StyledInput
        id={inputId}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrarLista}
        aria-controls={listId}
        aria-activedescendant={ativoValido >= 0 ? `${inputId}-opt-${ativoValido}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        $hasError={Boolean(error)}
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          setAberto(false);
          setAtivo(-1);
          onBlur?.(event);
        }}
        {...props}
      />
      {mostrarLista && (
        <Listbox ref={listaRef} id={listId} role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <Option
              key={option.id}
              id={`${inputId}-opt-${index}`}
              role="option"
              aria-selected={option.label === value}
              $active={index === ativoValido}
              $selected={option.label === value}
              // Evita o blur do campo antes do clique/toque ser tratado.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => escolher(option)}
            >
              {option.destaque && option.destaque.casado !== "" ? (
                <span>
                  {option.destaque.antes}
                  <Match>{option.destaque.casado}</Match>
                  {option.destaque.depois}
                </span>
              ) : (
                option.label
              )}
            </Option>
          ))}
        </Listbox>
      )}
      {mostrarCarregando && (
        <Message role="status">
          <Skeleton width="40%" height="12px" />
          <VisuallyHidden>Carregando modelos…</VisuallyHidden>
        </Message>
      )}
      {mostrarVazio && <Message>{emptyText}</Message>}
      <VisuallyHidden role="status" aria-live="polite">
        {resumo}
      </VisuallyHidden>
      {error && <ErrorText id={`${inputId}-error`}>{error}</ErrorText>}
    </Field>
  );
}
