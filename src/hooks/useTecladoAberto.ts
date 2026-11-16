"use client";

import { useEffect, useState } from "react";
import { useTeclado } from "@/components/teclado/TecladoProvider";

// Abaixo desta fração da altura da janela, a área visível foi reduzida por um teclado do sistema.
export const FRACAO_TECLADO_SISTEMA = 0.75;

// Há algum teclado na tela: o do Murel (aberto pelo `TecladoProvider`) ou o do sistema, que encolhe a área visível
// (por exemplo, ao digitar o modelo). Quem usa esconde o que fica fixo no rodapé para dar espaço ao conteúdo.
export function useTecladoAberto(): boolean {
  const { aberto } = useTeclado();
  const [doSistema, setDoSistema] = useState(false);

  useEffect(() => {
    const area = window.visualViewport;
    if (!area) {
      return;
    }
    const atualizar = () => setDoSistema(area.height < window.innerHeight * FRACAO_TECLADO_SISTEMA);
    area.addEventListener("resize", atualizar);
    return () => area.removeEventListener("resize", atualizar);
  }, []);

  return aberto || doSistema;
}
