"use client";

import { useFieldContext } from "@/components/form/context";
import { Input } from "@/components/ui/Input";
import { PRISMA_DIGITOS, PRISMA_MAX, PRISMA_MIN, somenteDigitosDoPrisma } from "@/lib/prisma";
import { TECLADO_INTEIRO } from "@/lib/teclado/tipos";

export interface PrismaFieldProps {
  disabled?: boolean;
  autoFocus?: boolean;
  "data-autofocus"?: string;
}

// Campo do prisma (inteiro de 1 a 999) dos formulários de entrada e da edição no pátio: só dígitos, teclado numérico.
export function PrismaField({ disabled, ...props }: PrismaFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;

  return (
    <Input
      label="Prisma"
      name={field.name}
      value={field.state.value}
      onChange={(event) => field.handleChange(somenteDigitosDoPrisma(event.target.value))}
      onBlur={field.handleBlur}
      error={typeof error === "string" ? error : error?.message}
      hint={`Número de ${PRISMA_MIN} a ${PRISMA_MAX}.`}
      inputMode="numeric"
      autoComplete="off"
      maxLength={PRISMA_DIGITOS}
      teclado={TECLADO_INTEIRO}
      disabled={disabled}
      required
      {...props}
    />
  );
}
