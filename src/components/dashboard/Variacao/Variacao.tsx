"use client";

import { percentual } from "../format";
import { TextoOculto } from "../shared.styles";
import { Raiz } from "./Variacao.styles";

export interface VariacaoProps {
  // Variação em %, com sinal (-100 = queda de 100%). Zero conta como alta, como na referência.
  valor: number;
  // O que foi comparado: "vs. quinta passada".
  texto?: string;
  // Padrão true: com fundo suave. Falso: só o texto colorido, para linhas de apoio.
  pilula?: boolean;
}

// A seta mostra o sentido para quem enxerga e o texto oculto o diz para quem não enxerga: a cor nunca fala sozinha.
export function Variacao({ valor, texto, pilula = true }: VariacaoProps) {
  const sentido = valor >= 0 ? "alta" : "queda";

  return (
    <Raiz $sentido={sentido} $pilula={pilula} data-sentido={sentido}>
      <span aria-hidden="true">{sentido === "alta" ? "▲" : "▼"}</span>
      <TextoOculto>{sentido === "alta" ? "Alta de " : "Queda de "}</TextoOculto>
      <span>{percentual(valor)}</span>
      {texto && (
        <>
          {" "}
          <span>{texto}</span>
        </>
      )}
    </Raiz>
  );
}
