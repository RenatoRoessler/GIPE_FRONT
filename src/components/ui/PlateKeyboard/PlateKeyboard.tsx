"use client";

import { normalizePlaca } from "@/lib/placa";
import { aceitaPlaca, tipoPosicaoPlaca } from "@/lib/teclado/placa";
import { Key } from "@/components/ui/Key";
import { EmptyCell, KeyGrid, KeyRow, KeyboardSheet, LetterCell } from "@/components/ui/KeyboardSheet";

const LINHAS_LETRAS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const LINHA_NUMEROS = "1234567890";
const BLOCO_NUMEROS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export interface PlateKeyboardProps {
  valor: string;
  onChar: (ch: string) => void;
  onApagar: () => void;
  // Mesmo `id` que o campo aponta em `aria-controls`.
  id?: string;
}

// Mostra só o que cabe na posição atual da placa: letras (1–3), número (4, 6–7) ou letra e número (5).
export function PlateKeyboard({ valor, onChar, onApagar, id }: PlateKeyboardProps) {
  const posicao = normalizePlaca(valor).length;
  const tipo = tipoPosicaoPlaca(posicao);
  const mostraLetras = tipo === "L" || tipo === "LN";

  function tecla(ch: string, size: "letter" | "digit" = "letter") {
    return (
      <LetterCell key={ch}>
        <Key label={ch} size={size} disabled={!aceitaPlaca(ch, posicao)} onPress={() => onChar(ch)} />
      </LetterCell>
    );
  }

  const apagar = <Key variant="fn" label="⌫" ariaLabel="Apagar" onPress={onApagar} />;

  return (
    <KeyboardSheet ariaLabel="Teclado de placa" id={id}>
      {mostraLetras ? (
        <>
          {tipo === "LN" && <KeyRow>{[...LINHA_NUMEROS].map((ch) => tecla(ch))}</KeyRow>}
          {LINHAS_LETRAS.map((linha, indice) => (
            <KeyRow key={linha}>
              {[...linha].map((ch) => tecla(ch))}
              {indice === LINHAS_LETRAS.length - 1 && <LetterCell $grow={1.5}>{apagar}</LetterCell>}
            </KeyRow>
          ))}
        </>
      ) : (
        <KeyGrid>
          {BLOCO_NUMEROS.map((linha, indice) => [
            ...linha.map((ch) => (
              <Key key={ch} size="digit" label={ch} disabled={!aceitaPlaca(ch, posicao)} onPress={() => onChar(ch)} />
            )),
            indice === 0 ? <div key="apagar">{apagar}</div> : <EmptyCell key={`vazio-${linha[0]}`} />,
          ])}
          <EmptyCell />
          <Key size="digit" label="0" disabled={!aceitaPlaca("0", posicao)} onPress={() => onChar("0")} />
          <EmptyCell />
          <EmptyCell />
        </KeyGrid>
      )}
    </KeyboardSheet>
  );
}
