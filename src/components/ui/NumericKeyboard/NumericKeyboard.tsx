"use client";

import { ReactNode } from "react";
import { aceitaNumerico } from "@/lib/teclado/numerico";
import type { ModoNumerico } from "@/lib/teclado/tipos";
import { Key } from "@/components/ui/Key";
import { EmptyCell, KeyGrid, KeyboardSheet } from "@/components/ui/KeyboardSheet";

export const NUMERICO_MAX_PADRAO = 20;

export interface NumericPadProps {
  // Decide, tecla a tecla, o que o campo aceita agora.
  aceita: (ch: string) => boolean;
  rotuloAcao: string;
  onChar: (ch: string) => void;
  onApagar: () => void;
  onAcao: () => void;
  // Células da última linha que ficam vazias no teclado numérico (esquerda e meio).
  inferior?: { esquerda: ReactNode; meio: ReactNode };
}

// Grade de 4 colunas no layout de discador, compartilhada com o teclado alfanumérico.
export function NumericPad({ aceita, rotuloAcao, onChar, onApagar, onAcao, inferior }: NumericPadProps) {
  const acaoFecha = rotuloAcao === "OK";
  const digito = (ch: string) => (
    <Key key={ch} size="digit" label={ch} disabled={!aceita(ch)} onPress={() => onChar(ch)} />
  );

  return (
    <KeyGrid>
      {digito("1")}
      {digito("2")}
      {digito("3")}
      <Key variant="fn" label="⌫" ariaLabel="Apagar" onPress={onApagar} />
      {digito("4")}
      {digito("5")}
      {digito("6")}
      <Key
        variant="action"
        label={rotuloAcao}
        ariaLabel={acaoFecha ? "Concluir" : "Próximo campo"}
        onPress={onAcao}
      />
      {["7", "8", "9"].map((ch) => digito(ch))}
      <Key
        variant="fn"
        label=".-"
        ariaLabel="Ponto, segure para hífen"
        disabled={!aceita(".")}
        onPress={() => onChar(".")}
        onLongPress={() => {
          if (aceita("-")) {
            onChar("-");
          }
        }}
      />
      {inferior?.esquerda ?? <EmptyCell />}
      {digito("0")}
      {inferior?.meio ?? <EmptyCell />}
      <Key variant="fn" label="," ariaLabel="Vírgula" disabled={!aceita(",")} onPress={() => onChar(",")} />
    </KeyGrid>
  );
}

export interface NumericKeyboardProps {
  modo: ModoNumerico;
  valor: string;
  maxLength?: number;
  // "Próximo" ou "OK" (último campo: fecha a folha).
  rotuloAcao: string;
  onChar: (ch: string) => void;
  onApagar: () => void;
  onAcao: () => void;
  id?: string;
}

export function NumericKeyboard({
  modo,
  valor,
  maxLength = NUMERICO_MAX_PADRAO,
  rotuloAcao,
  onChar,
  onApagar,
  onAcao,
  id,
}: NumericKeyboardProps) {
  return (
    <KeyboardSheet ariaLabel="Teclado numérico" id={id}>
      <NumericPad
        aceita={(ch) => aceitaNumerico(modo, valor, ch, maxLength)}
        rotuloAcao={rotuloAcao}
        onChar={onChar}
        onApagar={onApagar}
        onAcao={onAcao}
      />
    </KeyboardSheet>
  );
}
