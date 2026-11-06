"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { CameraButton } from "@/components/ui/CameraButton";
import { Input } from "@/components/ui/Input";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { normalizePlaca } from "@/lib/placa";
import type { SaidaBuscaValues } from "@/lib/schemas/saida";
import { LeitorPlacaModal } from "../LeitorPlacaModal";
import { Aviso, Divisor, Wrapper } from "./BuscaManualSaida.styles";
import { TECLADO_ALFA, TECLADO_INTEIRO, TECLADO_PLACA } from "@/lib/teclado/tipos";

export type SaidaBuscaField = keyof SaidaBuscaValues;

export interface BuscaManualSaidaProps {
  values: SaidaBuscaValues;
  errors: Partial<Record<SaidaBuscaField, string>>;
  onChange: (field: SaidaBuscaField, value: string) => void;
  // Enter em qualquer campo pede a consulta sem esperar o debounce.
  onEnter?: () => void;
  // Aviso da última consulta (ex.: veículo não encontrado).
  aviso?: string;
  disabled?: boolean;
}

const LABELS: Record<SaidaBuscaField, string> = {
  placa: "Placa",
  token: "Token",
  sequencial: "Sequencial",
};

const CAMPOS = Object.keys(LABELS) as SaidaBuscaField[];
const OPCOES = CAMPOS.map((field) => ({ value: field, label: LABELS[field] }));

// Rótulos do campo de digitação: distintos das opções para o leitor de tela não confundir os dois.
const ROTULOS_CAMPO: Record<SaidaBuscaField, string> = {
  placa: "Placa do veículo",
  token: "Token do cupom",
  sequencial: "Sequencial do veículo",
};

export const SEQUENCIAL_ENTER_HINT = "Pressione Enter para buscar";

// A API aceita um único identificador: o operador escolhe por qual campo busca e só esse campo aparece.
export function BuscaManualSaida({
  values,
  errors,
  onChange,
  onEnter,
  aviso,
  disabled = false,
}: BuscaManualSaidaProps) {
  const campoId = useId();
  const [leitorAberto, setLeitorAberto] = useState(false);
  // Abre no campo que já tem valor (ex.: placa vinda do pátio); senão, na placa.
  const [campo, setCampo] = useState<SaidaBuscaField>(() => CAMPOS.find((field) => values[field] !== "") ?? "placa");

  function trocarCampo(proximo: string) {
    const novo = proximo as SaidaBuscaField;
    if (novo === campo) {
      return;
    }
    // Só um identificador vale por vez: o valor do campo anterior sai da busca.
    if (values[campo] !== "") {
      onChange(campo, "");
    }
    setCampo(novo);
    // O campo novo ainda não existe no DOM: o foco vai a ele depois da renderização.
    setTimeout(() => document.getElementById(campoId)?.focus());
  }

  function handlePlacaLida(placa: string) {
    setLeitorAberto(false);
    // Só preenche o campo: a consulta segue o fluxo normal (debounce ou Enter).
    onChange("placa", placa);
  }

  function handleDigitarPlaca() {
    setLeitorAberto(false);
    // O modal devolve o foco ao botão que o abriu ao fechar; o campo da placa toma o foco logo depois.
    setTimeout(() => document.getElementById(campoId)?.focus());
  }

  const comum = {
    id: campoId,
    label: ROTULOS_CAMPO[campo],
    value: values[campo],
    error: errors[campo],
    disabled,
    autoComplete: "off",
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onEnter?.();
      }
    },
  };

  return (
    <Wrapper>
      <Divisor>ou informe sem QR Code</Divisor>
      <OptionGroup legend="Buscar por" options={OPCOES} value={campo} onChange={trocarCampo} disabled={disabled} variant="inline" />
      {campo === "placa" && (
        <Input
          {...comum}
          key="placa"
          endAction={<CameraButton size="sm" disabled={disabled} onClick={() => setLeitorAberto(true)} />}
          onChange={(event) => onChange("placa", normalizePlaca(event.target.value))}
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={7}
          teclado={TECLADO_PLACA}
        />
      )}
      {campo === "token" && (
        <Input
          {...comum}
          key="token"
          onChange={(event) => onChange("token", event.target.value)}
          autoCapitalize="characters"
          spellCheck={false}
          teclado={TECLADO_ALFA}
        />
      )}
      {campo === "sequencial" && (
        <Input
          {...comum}
          key="sequencial"
          hint={SEQUENCIAL_ENTER_HINT}
          onChange={(event) => onChange("sequencial", event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          enterKeyHint="search"
          teclado={TECLADO_INTEIRO}
        />
      )}
      <Aviso aria-live="polite">{aviso}</Aviso>
      <LeitorPlacaModal
        open={leitorAberto}
        onClose={() => setLeitorAberto(false)}
        onConfirm={handlePlacaLida}
        onDigitar={handleDigitarPlaca}
      />
    </Wrapper>
  );
}
