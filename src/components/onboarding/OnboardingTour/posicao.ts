import type { Retangulo } from "./useAlvoTour";

export type Tamanho = { width: number; height: number };

const FOLGA = 16;
const MARGEM = 16;

// Posição do balão (canto superior esquerdo) em relação ao item destacado: à direita do menu lateral, acima da barra inferior
// e, no que sobrar, abaixo. Sempre dentro da janela, com uma margem.
export function calcularPosicao(alvo: Retangulo, balao: Tamanho, janela: Tamanho): { top: number; left: number } {
  const limitar = (valor: number, minimo: number, maximo: number) => Math.max(minimo, Math.min(valor, maximo));
  const centroX = alvo.left + alvo.width / 2;
  const centroY = alvo.top + alvo.height / 2;

  let top: number;
  let left: number;
  if (alvo.left + alvo.width + FOLGA + balao.width + MARGEM <= janela.width && alvo.width < janela.width / 3) {
    left = alvo.left + alvo.width + FOLGA;
    top = centroY - balao.height / 2;
  } else if (centroY > janela.height / 2) {
    left = centroX - balao.width / 2;
    top = alvo.top - FOLGA - balao.height;
  } else {
    left = centroX - balao.width / 2;
    top = alvo.top + alvo.height + FOLGA;
  }

  return {
    left: limitar(left, MARGEM, Math.max(MARGEM, janela.width - balao.width - MARGEM)),
    top: limitar(top, MARGEM, Math.max(MARGEM, janela.height - balao.height - MARGEM)),
  };
}
