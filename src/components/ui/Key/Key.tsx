"use client";

import { useEffect, useRef } from "react";
import { KeySize, KeyVariant, StyledKey } from "./Key.styles";

const LONG_PRESS_MS = 450;
const VIBRATE_MS = 10;

export interface KeyProps {
  variant?: KeyVariant;
  // Tamanho do texto; por padrão acompanha a variante (letra para `char`, função para as demais).
  size?: KeySize;
  label: string;
  // Nome falado quando o rótulo visível não basta (ex.: "Apagar" para "⌫").
  ariaLabel?: string;
  disabled?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

function vibrar() {
  try {
    navigator.vibrate?.(VIBRATE_MS);
  } catch {
    // Sem suporte ou bloqueado pelo navegador: o toque segue sem vibração.
  }
}

export function Key({ variant = "char", size, label, ariaLabel, disabled, onPress, onLongPress }: KeyProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Quando o toque longo disparou, o `click` que vem ao soltar o dedo não conta como toque curto.
  const longPressDisparado = useRef(false);

  function cancelarTimer() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  useEffect(() => cancelarTimer, []);

  function iniciarToque() {
    longPressDisparado.current = false;
    if (!onLongPress || disabled) {
      return;
    }
    cancelarTimer();
    timer.current = setTimeout(() => {
      timer.current = null;
      longPressDisparado.current = true;
      vibrar();
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function tocar() {
    if (longPressDisparado.current) {
      longPressDisparado.current = false;
      return;
    }
    vibrar();
    onPress();
  }

  return (
    <StyledKey
      type="button"
      $variant={variant}
      $size={size ?? (variant === "char" ? "letter" : "fn")}
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerDown={iniciarToque}
      onPointerUp={cancelarTimer}
      onPointerCancel={cancelarTimer}
      onPointerLeave={cancelarTimer}
      onContextMenu={(event) => event.preventDefault()}
      onClick={tocar}
    >
      {label}
    </StyledKey>
  );
}
