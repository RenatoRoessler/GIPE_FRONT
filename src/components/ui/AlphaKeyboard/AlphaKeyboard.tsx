"use client";

import { useState } from "react";
import { aceitaAlfa } from "@/lib/teclado/alfa";
import { Key } from "@/components/ui/Key";
import { KeyRow, KeyboardSheet, LetterCell } from "@/components/ui/KeyboardSheet";
import { NumericPad } from "@/components/ui/NumericKeyboard";

export const ALFA_MAX_PADRAO = 40;

const LINHAS_LETRAS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

type ModoAlfa = "letras" | "numeros";

export interface AlphaKeyboardProps {
  valor: string;
  maxLength?: number;
  // Identifica o campo: ao mudar de campo o teclado volta ao modo letras.
  chave?: string;
  // "Próximo" ou "OK" (último campo: fecha a folha).
  rotuloAcao: string;
  onChar: (ch: string) => void;
  onApagar: () => void;
  onAcao: () => void;
  id?: string;
}

export function AlphaKeyboard({
  valor,
  maxLength = ALFA_MAX_PADRAO,
  chave,
  rotuloAcao,
  onChar,
  onApagar,
  onAcao,
  id,
}: AlphaKeyboardProps) {
  const [modo, setModo] = useState<ModoAlfa>("letras");
  const [chaveAnterior, setChaveAnterior] = useState(chave);
  if (chave !== chaveAnterior) {
    setChaveAnterior(chave);
    setModo("letras");
  }

  const aceita = (ch: string) => aceitaAlfa(valor, ch, maxLength);
  const espaco = (
    <Key variant="fn" size="small" label="ESPAÇO" ariaLabel="Espaço" disabled={!aceita(" ")} onPress={() => onChar(" ")} />
  );

  if (modo === "numeros") {
    return (
      <KeyboardSheet ariaLabel="Teclado de letras e números" id={id}>
        <NumericPad
          aceita={aceita}
          rotuloAcao={rotuloAcao}
          onChar={onChar}
          onApagar={onApagar}
          onAcao={onAcao}
          inferior={{
            esquerda: (
              <Key variant="fn" label="ABC" ariaLabel="Mostrar letras" onPress={() => setModo("letras")} />
            ),
            meio: espaco,
          }}
        />
      </KeyboardSheet>
    );
  }

  return (
    <KeyboardSheet ariaLabel="Teclado de letras e números" id={id}>
      {LINHAS_LETRAS.map((linha, indice) => (
        <KeyRow key={linha}>
          {[...linha].map((ch) => (
            <LetterCell key={ch}>
              <Key label={ch} disabled={!aceita(ch)} onPress={() => onChar(ch)} />
            </LetterCell>
          ))}
          {indice === LINHAS_LETRAS.length - 1 && (
            <LetterCell $grow={1.5}>
              <Key variant="fn" label="⌫" ariaLabel="Apagar" onPress={onApagar} />
            </LetterCell>
          )}
        </KeyRow>
      ))}
      <KeyRow>
        <LetterCell $grow={1.5}>
          <Key variant="fn" label="123" ariaLabel="Mostrar números" onPress={() => setModo("numeros")} />
        </LetterCell>
        <LetterCell $grow={4} $flexible>
          {espaco}
        </LetterCell>
        <LetterCell $grow={2} $flexible>
          <Key
            variant="action"
            label={rotuloAcao}
            ariaLabel={rotuloAcao === "OK" ? "Concluir" : "Próximo campo"}
            onPress={onAcao}
          />
        </LetterCell>
      </KeyRow>
    </KeyboardSheet>
  );
}
