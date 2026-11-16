"use client";

import { useStore } from "@tanstack/react-form";
import { InputHTMLAttributes, ReactNode, useId } from "react";
import { useTecladoCampo } from "@/components/teclado/useTecladoCampo";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { ErrorText, Field, HintText, type HintTone } from "@/components/ui/Input/Input.styles";
import { caracteresFaltando, mensagemFaltam, normalizePlaca } from "@/lib/placa";
import { TECLADO_PLACA } from "@/lib/teclado/tipos";
import { useFieldContext } from "./context";
import { PlateAction, PlateFrame, PlateInput, PlateLabel, PlateRow } from "./PlateField.styles";

export type PlateFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur" | "id" | "name"
> & {
  label: string;
  hint?: string;
  hintTone?: HintTone;
  // Ação à direita do número da placa (ex.: botão de câmera).
  action?: ReactNode;
  // Tira o rótulo da tela e o deixa só para o leitor de tela, ganhando a altura dele.
  hideLabel?: boolean;
  // Anel amarelo sempre visível em volta da placa, e não só com o foco.
  destaque?: boolean;
};

// Campo de placa: o texto digitado aparece sobre uma placa que muda de aspecto (Mercosul ou antiga).
export function PlateField({ label, hint, hintTone = "muted", action, hideLabel = false, destaque = false, ...props }: PlateFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();
  const tecladoProps = useTecladoCampo(TECLADO_PLACA, props);
  const tentouEnviar = useStore(field.form.store, (state) => state.submissionAttempts > 0);
  const faltam = caracteresFaltando(field.state.value);
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;
  // Enquanto o operador digita, a placa incompleta não é erro: só vira erro com os 7 caracteres ou ao tentar enviar.
  const mostraErro = faltam === 0 || tentouEnviar;
  const errorText = mostraErro ? (typeof error === "string" ? error : error?.message) : undefined;
  const digitando = faltam > 0 && faltam < 7;
  const visibleHint = errorText ? undefined : digitando ? mensagemFaltam(faltam) : hint;
  const visibleTone: HintTone = digitando ? "muted" : hintTone;

  return (
    <Field>
      <PlateLabel htmlFor={id} $hidden={hideLabel}>
        {label}
      </PlateLabel>
      <PlateFrame $destaque={destaque}>
        <PlateDisplay value={field.state.value} size="lg">
          <PlateRow>
            <PlateInput
              $hasAction={Boolean(action)}
              id={id}
              name={field.name}
              value={field.state.value}
              onChange={(event) => field.handleChange(normalizePlaca(event.target.value))}
              onBlur={field.handleBlur}
              placeholder="ABC1D23"
              maxLength={7}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={Boolean(errorText)}
              aria-describedby={errorText ? `${id}-error` : visibleHint ? `${id}-hint` : undefined}
              {...props}
              {...tecladoProps}
            />
            {action && <PlateAction>{action}</PlateAction>}
          </PlateRow>
        </PlateDisplay>
      </PlateFrame>
      {errorText && <ErrorText id={`${id}-error`}>{errorText}</ErrorText>}
      {visibleHint && (
        <HintText id={`${id}-hint`} role="status" $tone={visibleTone}>
          {visibleHint}
        </HintText>
      )}
    </Field>
  );
}
